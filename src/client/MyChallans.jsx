
import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";

function ChallanTable({ title, data }) {
  const [showFull, setShowFull] = useState({});
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const handleShowFull = (rowIdx, col) => {
    setShowFull(prev => ({ ...prev, [rowIdx + '-' + col]: !prev[rowIdx + '-' + col] }));
  };
  // Props: search, sortAsc
  // Filter and sort data using props
  let filtered = data.filter(c =>
    (!arguments[0]?.search?.vehicle || (c.vehicle_number && c.vehicle_number.toLowerCase().includes(arguments[0].search.vehicle.toLowerCase()))) &&
    (!arguments[0]?.search?.challan || (c.challan_no && c.challan_no.toLowerCase().includes(arguments[0].search.challan.toLowerCase())))
  );
  filtered = filtered.slice().sort((a, b) => {
    const dateA = new Date(a.challan_date_time.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3'));
    const dateB = new Date(b.challan_date_time.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3'));
    return arguments[0]?.sortAsc ? dateA - dateB : dateB - dateA;
  });
  // Only show up to visibleCount rows; allow loading more
  const limited = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > limited.length;

  const countColor = title && title.toLowerCase().includes('pending') ? '#d9534f' : (title && (title.toLowerCase().includes('settled') || title.toLowerCase().includes('disposed')) ? '#28a745' : '#666');
  return (
    <div className="dashboard-latest" style={{ marginBottom: 32, overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>
        {title} <span style={{fontSize:21, color: countColor, marginLeft:8, fontWeight:600}}>({filtered.length})</span>
      </h2>
      {filtered.length === 0 ? (
        <div style={{ color: '#888' }}>No challans found.</div>
      ) : (
        <>
        <table className="latest-table" style={{ width: '900px', minWidth: '100%', marginTop: 8, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Challan No</th>
              <th>Date/Time</th>
              <th>Owner</th>
              <th>Fine</th>
              <th>Status</th>
              <th>Offence Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {limited.map((c, idx) => (
              <tr key={c.challan_no || idx}>
                <td>
                  <div className="cell-ellipsis" title={c.vehicle_number}>{c.vehicle_number || '-'}</div>
                </td>
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
                <td style={{textAlign:'center'}}>
                  <button className="action-btn flat-btn" onClick={() => setSelectedChallan(c)}>
                    View Challan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12, textAlign:'center'}}>
          {hasMore ? (
            <button className="action-btn flat-btn" onClick={() => setVisibleCount(v => v + 5)}>Load more challans</button>
          ) : (
            <button className="action-btn flat-btn" disabled style={{opacity:0.7}}>No more challans</button>
          )}
        </div>
        </>
      )}
      <CustomModal
        open={!!selectedChallan}
        title={selectedChallan ? `Challan Details: ${selectedChallan.challan_no}` : ''}
        onConfirm={() => setSelectedChallan(null)}
        onCancel={() => setSelectedChallan(null)}
        confirmText="Close"
        cancelText={null}
      >
        {selectedChallan && (
          <div style={{lineHeight:1.7, fontSize:15}}>
            <div><b>Status:</b> {selectedChallan.challan_status}</div>
            <div><b>Vehicle Number:</b> {selectedChallan.vehicle_number}</div>
            <div><b>Challan No:</b> {selectedChallan.challan_no}</div>
            <div><b>Date/Time:</b> {selectedChallan.challan_date_time}</div>
            <div><b>Location:</b> {selectedChallan.challan_place || selectedChallan.location || selectedChallan.challan_location}</div>
            <div><b>Owner Name:</b> {selectedChallan.owner_name}</div>
            <div><b>Driver Name:</b> {selectedChallan.driver_name}</div>
            <div><b>Name of Violator:</b> {selectedChallan.name_of_violator}</div>
            <div><b>Department:</b> {selectedChallan.department}</div>
            <div><b>State Code:</b> {selectedChallan.state_code}</div>
            <div><b>RTO District Name:</b> {selectedChallan.rto_distric_name}</div>
            <div><b>Remark:</b> {selectedChallan.remark}</div>
            <div><b>Document Impounded:</b> {selectedChallan.document_impounded}</div>
            <div><b>Sent to Court On:</b> {selectedChallan.sent_to_court_on}</div>
            <div><b>Sent to Reg Court:</b> {selectedChallan.sent_to_reg_court}</div>
            <div><b>Sent to Virtual Court:</b> {selectedChallan.sent_to_virtual_court}</div>
            <div><b>Court Name:</b> {selectedChallan.court_name}</div>
            <div><b>Court Address:</b> {selectedChallan.court_address}</div>
            <div><b>Date of Proceeding:</b> {selectedChallan.date_of_proceeding}</div>
            <div><b>DL No:</b> {selectedChallan.dl_no}</div>
            {selectedChallan.challan_status === 'Disposed' && (
              <>
                <div><b>Receipt No:</b> {selectedChallan.receipt_no}</div>
                <div><b>Received Amount:</b> {selectedChallan.received_amount}</div>
              </>
            )}
            <div><b>Fine Imposed:</b> {selectedChallan.fine_imposed}</div>
            <div><b>Amount of Fine Imposed:</b> {selectedChallan.amount_of_fine_imposed}</div>
            <div><b>Act:</b> {Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.length > 0 ? selectedChallan.offence_details[0].act : ''}</div>
            <div><b>Offence Details:</b>
              <ul style={{margin:0,paddingLeft:18}}>
                {Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.map((o, j) => (
                  <li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CustomModal>
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
        // Flatten all pending and disposed challans from all vehicles, and add vehicle_number to each challan
        const allPending = [];
        const allDisposed = [];
        if (Array.isArray(data)) {
          data.forEach(vehicle => {
            if (Array.isArray(vehicle.pending_data)) {
              vehicle.pending_data.forEach(c => {
                allPending.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
            if (Array.isArray(vehicle.disposed_data)) {
              vehicle.disposed_data.forEach(c => {
                allDisposed.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
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

  const [search, setSearch] = useState({ vehicle: '', challan: '' });
  const [sortAsc, setSortAsc] = useState(true);
  return (
    <div className="my-challans-content">
      <h1 className="page-title">My Challans</h1>
      <p className="page-subtitle">View and manage your Settled and Disposed challans</p>
      <div style={{display:'flex',gap:16,marginBottom:12}}>
        <input
          type="text"
          placeholder="Search Vehicle Number"
          value={search.vehicle}
          onChange={e => setSearch(s => ({ ...s, vehicle: e.target.value }))}
          style={{padding:'6px 12px',fontSize:15,borderRadius:4,border:'1px solid #ccc',width:180}}
        />
        <input
          type="text"
          placeholder="Search Challan Number"
          value={search.challan}
          onChange={e => setSearch(s => ({ ...s, challan: e.target.value }))}
          style={{padding:'6px 12px',fontSize:15,borderRadius:4,border:'1px solid #ccc',width:180}}
        />
        <button
          className="action-btn flat-btn"
          style={{padding:'6px 16px',fontSize:15,borderRadius:4,border:'1px solid #ccc',background:'#f5f5f5',color:'#222'}}
          onClick={() => setSortAsc(s => !s)}
        >
          Sort Date {sortAsc ? '▲' : '▼'}
        </button>
      </div>
  <ChallanTable title="Pending Challans" data={challanData.Pending_data} search={search} sortAsc={sortAsc} />
  <ChallanTable title="Settled Challans" data={challanData.Disposed_data} search={search} sortAsc={sortAsc} />
    </div>
  );
}
