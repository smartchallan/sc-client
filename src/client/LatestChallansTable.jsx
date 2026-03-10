import React from "react";
// import { FaDownload, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";

const LatestChallansTable = ({ latestChallanRows, loadingVehicleChallan, vehicleChallanError, totalCount = 0, limit = 5 }) => (
    <div className="vst-card">
      <div className="vst-header">
        <div className="vst-header__left">
          <span className="vst-header__icon-box">
            <i className="ri-alarm-warning-line"></i>
          </span>
          <div>
            <h2 className="vst-header__title">Latest Challans</h2>
            <span className="vst-header__count">{Array.isArray(latestChallanRows) ? latestChallanRows.length : 0} of {totalCount} records</span>
          </div>
        </div>
        <span className="vst-record-badge">
          Showing {Array.isArray(latestChallanRows) ? latestChallanRows.length : 0} of {totalCount}
        </span>
      </div>
    {/* Caption row removed, now next to title */}
    {loadingVehicleChallan ? (
      <div>Loading challans...</div>
    ) : vehicleChallanError ? (
      <div style={{color:'#d32f2f'}}>Error loading challans.</div>
    ) : (
      <div>
        
        <div className="vst-table-wrap" id="latest-challans-table-print-area">
          <table className="vst-table">
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

        <div style={{ textAlign: 'right', padding: '12px 20px' }}>
          <button
            className="vst-btn vst-btn--outline"
            style={{ background: '#fff', color: '#3b82f6', border: '1.5px solid #bfdbfe' }}
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
