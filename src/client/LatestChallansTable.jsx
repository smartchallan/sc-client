import "./LatestTable.css";
import React from "react";
// import { FaDownload, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";

const LatestChallansTable = ({ latestChallanRows, loadingVehicleChallan, vehicleChallanError, totalCount = 0, limit = 5 }) => (
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
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{
            margin: 0,
            fontSize: 19,
            color: '#b26a00',
            letterSpacing: '0.01em',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            lineHeight: 1.2,
            fontWeight: 700,
          }}>Latest Challans</h2>
        </div>
        <div
          style={{
            color: '#b26a00',
            fontSize: 14,
            background: '#f5f8fa',
            border: '1.5px solid #ffd200',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 700,
            display: 'inline-block',
            marginLeft: 16,
            boxShadow: '0 1px 4px #ffd20022',
          }}
        >
          Showing {Array.isArray(latestChallanRows) ? latestChallanRows.length : 0} of {totalCount} records
        </div>
      </div>
    {/* Caption row removed, now next to title */}
    {loadingVehicleChallan ? (
      <div>Loading challans...</div>
    ) : vehicleChallanError ? (
      <div style={{color:'#d32f2f'}}>Error loading challans.</div>
    ) : (
      <div>
        
        <div className="table-container" id="latest-challans-table-print-area">
          <table className="latest-table">
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle No.</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Offence</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestChallanRows}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'right', marginTop: 12, marginLeft: 20 }}>
          <button
            className="action-btn"
            onClick={e => {
              e.preventDefault();
              if (typeof window !== 'undefined' && window.handleViewAllChallans) {
                window.handleViewAllChallans();
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

export default LatestChallansTable;
