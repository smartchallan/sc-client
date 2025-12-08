import React, { useState } from "react";
import { FaSyncAlt, FaEye, FaDownload, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function VehicleSummaryTable({ data, loading, onRefresh, onView }) {
 
  // Sort by registered_at DESC
  const sorted = [...(data || [])].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));

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
          }}>Vehicle Summary</h2>
        </div>
        <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, display: 'inline-block', marginLeft: 16, boxShadow: '0 1px 4px #21cbf322' }}>
          Showing {sorted.length} records
        </div>
      </div>
      
      <div className="table-container" id="vehicle-summary-table-print-area">
        <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle</th>
              <th>Registration Date</th>
              {/* <th>Pending / Disposed</th> */}
              <th>Insurance Exp</th>
              <th>Road Tax Exp</th>
              <th>Fitness Exp</th>
              <th>Pollution Exp</th>
              <th>Challans</th>
              <th>Action</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}>Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={10}>No data found.</td></tr>
            ) : (
              sorted.map((row, idx) => (
                <tr key={row.vehicle_id || idx}>
                  <td>{idx + 1}</td>
                  <td>{row.vehicle_number || '-'}</td>
                  <td>{row.rc_regn_dt || row.registration_date || row.registered_at || '-'}</td>
                  {/* <td>
                    <span style={{color: (row.pending_challan_count > 0 ? '#e74c3c' : '#333'), fontWeight: 600}}>{row.pending_challan_count ?? 0}</span>
                    <span style={{color: '#888', fontWeight: 600}}>/</span>
                    <span style={{color: (row.disposed_challan_count > 0 ? '#43a047' : '#333'), fontWeight: 600}}>{row.disposed_challan_count ?? 0}</span>
                  </td> */}
                  <td>{typeof row.insurance_exp === 'object' && row.insurance_exp !== null ? (row.insurance_exp.value ?? JSON.stringify(row.insurance_exp)) : (row.insurance_exp || '-')}</td>
                  <td>{typeof row.road_tax_exp === 'object' && row.road_tax_exp !== null ? (row.road_tax_exp.value ?? JSON.stringify(row.road_tax_exp)) : (row.road_tax_exp || '-')}</td>
                  <td>{typeof row.fitness_exp === 'object' && row.fitness_exp !== null ? (row.fitness_exp.value ?? JSON.stringify(row.fitness_exp)) : (row.fitness_exp || '-')}</td>
                  <td>{typeof row.pollution_exp === 'object' && row.pollution_exp !== null ? (row.pollution_exp.value ?? JSON.stringify(row.pollution_exp)) : (row.pollution_exp || '-')}</td>
                  <td>
                    <span style={{color: (row.pending_challan_count > 0 ? '#e74c3c' : '#333'), fontWeight: 600}}>{row.pending_challan_count ?? 0}</span>
                    <span style={{color: '#888', fontWeight: 600}}>/</span>
                    <span style={{color: (row.disposed_challan_count > 0 ? '#43a047' : '#333'), fontWeight: 600}}>{row.disposed_challan_count ?? 0}</span>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button className="action-btn flat-btn" style={{padding:'4px 10px',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => onRefresh(row)} title="Refresh">
                      <FaSyncAlt />
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button className="action-btn flat-btn" style={{padding:'4px 10px',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => onView(row)} title="View Vehicle">
                      <FaEye />
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
