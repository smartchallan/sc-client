import React, { useState, useEffect } from "react";
import "./VehicleTableOnly.css";

function ChallanTable({ title, data }) {
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
  const [challanData, setChallanData] = useState({ Disposed_data: [], Pending_data: [] });
  useEffect(() => {
    async function fetchChallans() {
      try {
        const API_ROOT = import.meta.env.VITE_API_BASE_URL;
        if (!API_ROOT) {
          throw new Error('VITE_API_BASE_URL is not set. Please check your .env file and restart the dev server.');
        }
        const clientId = 5;
        const url = `${API_ROOT}/getvehicleechallandata?clientId=${clientId}`;
        const res = await fetch(url);
        const data = await res.json();
        // Flatten all pending and disposed challans from all vehicles
        const allPending = [];
        const allDisposed = [];
        if (Array.isArray(data)) {
          data.forEach(vehicle => {
            if (Array.isArray(vehicle.pending_data)) {
              allPending.push(...vehicle.pending_data);
            }
            if (Array.isArray(vehicle.disposed_data)) {
              allDisposed.push(...vehicle.disposed_data);
            }
          });
        }
        setChallanData({
          Disposed_data: allDisposed,
          Pending_data: allPending
        });
      } catch (err) {
        setChallanData({ Disposed_data: [], Pending_data: [] });
      }
    }
    fetchChallans();
  }, []);

  return (
    <div className="my-challans-content">
      <h1 className="page-title">My Challans</h1>
      <p className="page-subtitle">View and manage your Settled and Disposed challans</p>
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
