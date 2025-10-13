import React from "react";

const LatestChallansTable = ({ latestChallanRows, loadingVehicleChallan, vehicleChallanError }) => (
  <div className="dashboard-latest">
    <div className="latest-header">
      <h2>Latest Challans</h2>
      <a
        href="#"
        className="view-all"
        onClick={e => {
          e.preventDefault();
          if (typeof window !== 'undefined' && window.handleViewAllChallans) {
            window.handleViewAllChallans();
          }
        }}
      >View All</a>
    </div>
    {loadingVehicleChallan ? (
      <div>Loading challans...</div>
    ) : vehicleChallanError ? (
      <div style={{color:'#d32f2f'}}>Error loading challans.</div>
    ) : (
      <table className="latest-table" style={{ width: '100%', marginTop: 8, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{}}>Vehicle Number</th>
            <th style={{}}>Challan No</th>
            <th style={{}}>Date/Time</th>
            <th style={{}}>Location</th>
            <th style={{}}>Challan Act</th>
            <th style={{}}>Fine Imposed</th>
            <th style={{}}>Status</th>
            <th style={{}}>Offence Details</th>
            <th style={{textAlign:'center'}}>Action</th>
          </tr>
        </thead>
        <tbody>
          {latestChallanRows}
        </tbody>
      </table>
    )}
  </div>
);

export default LatestChallansTable;
