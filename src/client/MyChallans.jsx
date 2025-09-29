import React, { useState } from "react";
import "./VehicleTableOnly.css";

// Static challan data (replace with API if needed)
const challanData = {
  Disposed_data: [
    {
      challan_no: "KL48648220311113821",
      challan_date_time: "11-03-2022 11:38:21",
      owner_name: "T**T P*T L*D",
      fine_imposed: "1",
      challan_status: "Disposed",
      offence_details: [
        { name: "test offence 1 rupee" }
      ]
    },
    {
      challan_no: "KL48648220225112001",
      challan_date_time: "25-02-2022 11:20:01",
      owner_name: "T**T P*T L*D",
      fine_imposed: "1",
      challan_status: "Disposed",
      offence_details: [
        { name: "test offence 1 rupee" }
      ]
    }
  ],
  Pending_data: [
    {
      challan_no: "KL548476230713105383",
      challan_date_time: "01-09-2023 17:36:00",
      owner_name: "T**T P*T L*D",
      fine_imposed: "7750",
      challan_status: "Pending",
      offence_details: [
        { name: "Fitness certificate (CF) of a transport vehicle not produced on demand for examination by the officer authorised." },
        { name: "Driving or causing or allowing to be driven a vehicle as contract carriage without valid permit.(MMV and HMV)" }
      ]
    },
    {
      challan_no: "KL48648220311114937",
      challan_date_time: "11-03-2022 11:49:37",
      owner_name: "T**T P*T L*D",
      fine_imposed: "1",
      challan_status: "Pending",
      offence_details: [
        { name: "test offence 1 rupee" }
      ]
    }
  ]
};

function ChallanTable({ title, data }) {
  // For showing full text on click
  const [showFull, setShowFull] = useState({});
  const handleShowFull = (rowIdx, col) => {
    setShowFull(prev => ({ ...prev, [rowIdx + '-' + col]: !prev[rowIdx + '-' + col] }));
  };
  return (
    <div className="dashboard-latest" style={{ marginBottom: 32, overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{title}</h2>
      {data.length === 0 ? (
        <div style={{ color: '#888' }}>No challans found.</div>
      ) : (
        <table className="latest-table" style={{ width: '900px', minWidth: '100%', marginTop: 8, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '28%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Date/Time</th>
              <th>Owner</th>
              <th>Fine</th>
              <th>Status</th>
              <th>Offence Details</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, idx) => (
              <tr key={c.challan_no || idx}>
                <td>
                  <div
                    className={`cell-ellipsis${showFull[idx+'-challan_no'] ? ' cell-wrap' : ''}`}
                    title={c.challan_no}
                    onClick={() => handleShowFull(idx, 'challan_no')}
                    style={{ cursor: c.challan_no && c.challan_no.length > 16 ? 'pointer' : 'default' }}
                  >
                    {showFull[idx+'-challan_no'] ? c.challan_no : <span>{c.challan_no.length > 16 ? c.challan_no.slice(0, 16) + '…' : c.challan_no}</span>}
                  </div>
                </td>
                <td>
                  <div className="cell-ellipsis" title={c.challan_date_time}>{c.challan_date_time}</div>
                </td>
                <td>
                  <div
                    className={`cell-ellipsis${showFull[idx+'-owner'] ? ' cell-wrap' : ''}`}
                    title={c.owner_name}
                    onClick={() => handleShowFull(idx, 'owner')}
                    style={{ cursor: c.owner_name && c.owner_name.length > 14 ? 'pointer' : 'default' }}
                  >
                    {showFull[idx+'-owner'] ? c.owner_name : <span>{c.owner_name.length > 14 ? c.owner_name.slice(0, 14) + '…' : c.owner_name}</span>}
                  </div>
                </td>
                <td>{c.fine_imposed}</td>
                <td>
                  <span className={
                    c.challan_status === 'Pending' ? 'status pending' :
                    c.challan_status === 'Disposed' ? 'status paid' : ''
                  }>
                    {c.challan_status}
                  </span>
                </td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {Array.isArray(c.offence_details) && c.offence_details.map((o, i) => (
                      <li
                        key={i}
                        className={`cell-ellipsis${showFull[idx+'-offence'+i] ? ' cell-wrap' : ''}`}
                        title={o.name}
                        onClick={() => handleShowFull(idx, 'offence'+i)}
                        style={{ cursor: o.name && o.name.length > 30 ? 'pointer' : 'default' }}
                      >
                        {showFull[idx+'-offence'+i] ? o.name : <span>{o.name.length > 30 ? o.name.slice(0, 30) + '…' : o.name}</span>}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style>{`
        .cell-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          display: block;
          transition: all 0.2s;
        }
        .cell-ellipsis.cell-wrap {
          white-space: normal !important;
          word-break: break-word;
          background: #f9f9f9;
          border-radius: 2px;
          padding: 2px 4px;
        }
        .latest-table td, .latest-table th {
          vertical-align: top;
        }
        .dashboard-latest {
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

export default function MyChallans() {
  return (
    <div className="my-challans-content">
      <h1>My Challans</h1>
      <style>{`
        .cell-ellipsis {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          display: block;
        }
        .latest-table td, .latest-table th {
          vertical-align: top;
        }
      `}</style>
      <ChallanTable title="Settled Challans" data={challanData.Disposed_data} />
      <ChallanTable title="Pending Challans" data={challanData.Pending_data} />
    </div>
  );
}
