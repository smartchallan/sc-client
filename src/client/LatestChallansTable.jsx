import React from "react";

const LatestChallansTable = ({ latestChallanRows, loadingVehicleChallan, vehicleChallanError, totalCount = 0, limit = 5 }) => (
  <div className="dashboard-latest">
    <div className="latest-header">
      <h2>Vehicle Challan Data</h2>
    </div>
    <div className="table-caption-row">
      <div />
      {limit > 0 && (
        <div className="table-caption">Showing {Array.isArray(latestChallanRows) ? latestChallanRows.length : 0} of {totalCount}</div>
      )}
    </div>
    {loadingVehicleChallan ? (
      <div>Loading challans...</div>
    ) : vehicleChallanError ? (
      <div style={{color:'#d32f2f'}}>Error loading challans.</div>
    ) : (
      <>
        <table className="latest-table" style={{ width: '100%', marginTop: 8, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Vehicle Number</th>
              <th>Challan No</th>
              <th>Date/Time</th>
              <th style={{ textAlign: 'center' }}>Location</th>
              <th>Sent to Reg Court</th>
              <th>Sent to Virtual Court</th>
              <th>Fine Imposed</th>
              <th>Status</th>
              <th>Offence Details</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {latestChallanRows}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
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
      </>
    )}
  </div>
);

export default LatestChallansTable;
