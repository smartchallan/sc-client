import React from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function LatestRTOTable({ vehicleData = [], loading, error, setSelectedRtoData, totalCount }) {
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
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{
            margin: 0,
            fontSize: 19,
            color: '#256029',
            letterSpacing: '0.01em',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            lineHeight: 1.2,
            fontWeight: 700,
          }}>RTO Data</h2>
        </div>
        <div
          style={{
            color: '#256029',
            fontSize: 14,
            background: '#f5f8fa',
            border: '1.5px solid #43e97b',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 700,
            display: 'inline-block',
            marginLeft: 16,
            boxShadow: '0 1px 4px #38f9d722',
          }}
        >
          Showing {vehicleData.length} of {totalCount ?? vehicleData.length} records
        </div>
      </div>
      {loading && <div>Loading vehicle data...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      {/* Caption row removed, now next to title */}
      
      <div className="table-container" id="latest-rto-table-print-area">
        <table className="latest-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle No.</th>
              <th>Insurance</th>
              <th>RoadTax</th>
              <th>Fitness</th>
              <th>Pollution</th>
              <th className="print-hide">Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicleData.length === 0 ? (
              <tr><td colSpan={7}>No vehicle data found.</td></tr>
            ) : (
              vehicleData.map((v, idx) => (
                <tr key={v.rc_regn_no || idx}>
                  <td>{idx + 1}</td>
                  <td>{v.rc_regn_no || '-'}</td>
                  <td>{v.insurance_exp || v.rc_insurance_upto || '-'}</td>
                  <td>{v.road_tax_exp || v.rc_tax_upto || '-'}</td>
                  <td>{v.fitness_exp || v.rc_fit_upto || '-'}</td>
                  <td>{v.pollution_exp || v.rc_pucc_upto || '-'}</td>
                  <td className="print-hide" style={{textAlign:'center'}}>
                    <button className="action-btn flat-btn" style={{padding:'4px 10px',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => setSelectedRtoData && setSelectedRtoData(v)} title="View Vehicle">
                      <i className="ri-eye-line" style={{fontSize:18,verticalAlign:'middle'}} />
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
