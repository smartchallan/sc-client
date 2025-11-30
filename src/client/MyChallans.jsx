
import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import RightSidebar from "./RightSidebar";
import "./RightSidebar.css";
import "../RegisterVehicle.css";

export function ChallanTable({ title, data, search = {}, sortAsc = true, addToCart, removeFromCart, cart, showCart, setShowCart, settlementMode }) {
  const [showFull, setShowFull] = useState({});
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const DEFAULT_LIMIT = 10;
  const [visibleCount, setVisibleCount] = useState(DEFAULT_LIMIT);
  const [infoModal, setInfoModal] = useState({ open: false, message: '' });
  const handleShowFull = (rowIdx, col) => {
    setShowFull(prev => ({ ...prev, [rowIdx + '-' + col]: !prev[rowIdx + '-' + col] }));
  };
  // Filter and sort data using props
  const formatRegCourtValue = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '-';
      if (s.toLowerCase() === 'yes' || s.toLowerCase() === 'no') return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      if (/\d{4}-\d{2}-\d{2}/.test(s) || /\d{2}-\d{2}-\d{4}/.test(s) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(s)) return s.length > 10 ? s.slice(0, 10) : s;
      return s;
    }
    return String(v);
  };

  let filtered = (Array.isArray(data) ? data : []).filter(c =>
    (!search?.vehicle || (c.vehicle_number && c.vehicle_number.toLowerCase().includes(search.vehicle.toLowerCase()))) &&
    (!search?.challan || (c.challan_no && c.challan_no.toLowerCase().includes(search.challan.toLowerCase())))
  );
  filtered = filtered.slice().sort((a, b) => {
    const parse = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')) : new Date(0);
    const dateA = parse(a.challan_date_time || a.created_at || a.createdAt);
    const dateB = parse(b.challan_date_time || b.created_at || b.createdAt);
    return sortAsc ? dateA - dateB : dateB - dateA;
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
      {filtered.length > 0 && (
        <div
          style={{
            color: '#222',
            fontSize: 15,
            background: title && title.toLowerCase().includes('pending') ? '#ffe9b3' : '#e3f7d6',
            border: title && title.toLowerCase().includes('pending') ? '1.5px solid #f7b500' : '1.5px solid #4caf50',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 600,
            display: 'inline-block',
            marginBottom: 8
          }}
        >
          Showing {Math.min(filtered.length, visibleCount)} of {filtered.length} challans
        </div>
      )}
      {filtered.length === 0 ? (
        <div style={{ color: '#888' }}>No challans found.</div>
      ) : (
        <>
        <div className="table-scroll-x" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table
            className="latest-table responsive-table"
            style={{
              width: '100%',
              marginTop: 8,
              tableLayout: 'auto',
            }}
          >
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Vehicle Number</th>
                <th>Challan No</th>
                <th>Date/Time</th>
                <th style={{ textAlign: 'center' }}>Location</th>
                {title && title.toLowerCase().includes('pending') && <th>Sent to Reg Court</th>}
                {title && title.toLowerCase().includes('pending') && <th>Sent to Virtual Court</th>}
                <th>Fine Imposed</th>
                {title && title.toLowerCase().includes('disposed') && <th>Fine Paid</th>}
                <th>Status</th>
                <th>Offence Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {limited.map((c, idx) => (
                <tr key={c.challan_no || idx}>
                  <td style={{wordBreak:'break-word',maxWidth:60}}>{idx + 1}</td>
                  <td style={{wordBreak:'break-word',maxWidth:120}}>
                    <div className="cell-ellipsis" title={c.vehicle_number}>{c.vehicle_number || '-'}</div>
                  </td>
                  <td style={{wordBreak:'break-word',maxWidth:140}}>
                    <div
                      className={`cell-ellipsis${showFull[idx+'-challan_no'] ? ' cell-wrap' : ''}`}
                      title={c.challan_no}
                      onClick={() => handleShowFull(idx, 'challan_no')}
                      style={{ cursor: c.challan_no && c.challan_no.length > 16 ? 'pointer' : 'default' }}
                    >
                      {showFull[idx+'-challan_no'] ? c.challan_no : <span>{c.challan_no && c.challan_no.length > 16 ? c.challan_no.slice(0, 16) + '…' : c.challan_no}</span>}
                    </div>
                  </td>
                  <td style={{wordBreak:'break-word',maxWidth:120}}>
                    <div className="cell-ellipsis" title={c.challan_date_time || c.created_at || c.createdAt}>{c.challan_date_time || c.created_at || c.createdAt}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {(() => {
                      const loc = c.challan_place || c.location || c.challan_location || c.address || c.owner_address;
                      if (loc && typeof loc === 'string' && loc.trim()) {
                        const openMap = (address) => {
                          setInfoModal({
                            open: true,
                            message: (
                              <iframe
                                title="Google Maps"
                                width="910"
                                height="500"
                                style={{ border: 0, borderRadius: 12 }}
                                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                                allowFullScreen
                              />
                            )
                          });
                        };
                        return (
                          <span
                            style={{ cursor: 'pointer', color: '#4285F4', fontSize: 20, verticalAlign: 'middle' }}
                            title={loc}
                            onClick={() => openMap(loc)}
                          >
                            <i className="ri-map-pin-2-fill" />
                          </span>
                        );
                      }
                      return 'Not Available';
                    })()}
                  </td>
                  {title && title.toLowerCase().includes('pending') && (
                    <td style={{ textAlign: 'center' }}>{formatRegCourtValue(c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court)}</td>
                  )}
                  {title && title.toLowerCase().includes('pending') && (
                    <td style={{ textAlign: 'center' }}>{formatRegCourtValue(c.sent_to_virtual_court ?? c.sent_to_virtual)}</td>
                  )}
                  <td style={{ textAlign: "center"}}>{c.fine_imposed}</td>
                  {title && title.toLowerCase().includes('disposed') && (
                    <td style={{ textAlign: "center"}}>{c.received_amount ?? '-'}</td>
                  )}
                  <td><span className={c.challan_status === 'Pending' ? 'status pending' : c.challan_status === 'Disposed' ? 'status paid' : ''}>{c.challan_status}</span></td>
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
                    {settlementMode ? (
                      cart && cart.some(ch => ch.challan_no === c.challan_no) ? (
                        <button className="action-btn flat-btn" style={{ background: '#eee', color: '#1976d2', padding: '0 12px', fontSize: '13px', minWidth: 0, height: '32px', lineHeight: '32px' }} onClick={() => removeFromCart && removeFromCart(c)}>
                          Remove from Cart
                        </button>
                      ) : (
                        <button className="action-btn flat-btn" style={{ background: '#1976d2', color: '#fff', padding: '0 12px', fontSize: '13px', minWidth: 0, height: '32px', lineHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => addToCart && addToCart(c)}>
                          <i className="ri-shopping-cart-2-line" style={{ fontSize: 18, color: '#fff', verticalAlign: 'middle' }}></i>
                        </button>
                      )
                    ) : (
                      <button
                        className="action-btn flat-btn"
                        style={{ padding: '0 12px', fontSize: '13px', minWidth: 0, height: '32px', lineHeight: '32px', display: 'inline-block', verticalAlign: 'middle', boxSizing: 'border-box' }}
                        onClick={() => { setSelectedChallan(c); setSidebarOpen(true); }}
                      >
                        View Challan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Show more records dropdown below the table, aligned left */}
        {hasMore && (
          <div style={{ marginTop: 10, textAlign: 'left' }}>
            <span style={{ fontWeight: 600, marginRight: 10, color: '#1976d2', fontSize: 15 }}>Show more records:</span>
            <select
              style={{
                padding: '7px 16px',
                borderRadius: 6,
                border: '1.5px solid #1976d2',
                fontSize: 15,
                fontWeight: 600,
                color: '#1976d2',
                background: '#f5faff',
                outline: 'none',
                marginRight: 8
              }}
              value={0}
              onChange={e => {
                const val = e.target.value;
                if (val === 'all') setVisibleCount(filtered.length);
                else setVisibleCount(prev => Math.min(prev + Number(val), filtered.length));
              }}
            >
              <option value={0} disabled>Select</option>
              <option value={10}>10 more</option>
              <option value={50}>50 more</option>
              <option value={100}>100 more</option>
              <option value={200}>200 more</option>
              <option value="all">All records</option>
            </select>
          </div>
        )}
        </>
      )}
      <CustomModal
        open={infoModal.open}
        title={infoModal.message}
        onConfirm={() => setInfoModal({ open: false, message: '' })}
        onCancel={() => setInfoModal({ open: false, message: '' })}
        confirmText="OK"
        cancelText={null}
      />
      <RightSidebar
        open={sidebarOpen && !!selectedChallan}
        onClose={() => {
          setSidebarOpen(false);
          setTimeout(() => setSelectedChallan(null), 300);
        }}
        title={selectedChallan ? `Challan Details: ${selectedChallan.challan_no}` : ''}
      >
        {selectedChallan && (
          <table className="latest-table" style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr><td><b>Status</b></td><td>{selectedChallan.challan_status}</td></tr>
              <tr><td><b>Vehicle Number</b></td><td>{selectedChallan.vehicle_number}</td></tr>
              <tr><td><b>Challan No</b></td><td>{selectedChallan.challan_no}</td></tr>
              <tr><td><b>Date/Time</b></td><td>{selectedChallan.challan_date_time}</td></tr>
              <tr><td><b>Location</b></td><td>{selectedChallan.challan_place || selectedChallan.location || selectedChallan.challan_location}</td></tr>
              <tr><td><b>Owner Name</b></td><td>{selectedChallan.owner_name}</td></tr>
              <tr><td><b>Driver Name</b></td><td>{selectedChallan.driver_name}</td></tr>
              <tr><td><b>Name of Violator</b></td><td>{selectedChallan.name_of_violator}</td></tr>
              <tr><td><b>Department</b></td><td>{selectedChallan.department}</td></tr>
              <tr><td><b>State Code</b></td><td>{selectedChallan.state_code}</td></tr>
              <tr><td><b>RTO District Name</b></td><td>{selectedChallan.rto_distric_name}</td></tr>
              <tr><td><b>Remark</b></td><td>{selectedChallan.remark}</td></tr>
              <tr><td><b>Document Impounded</b></td><td>{selectedChallan.document_impounded}</td></tr>
              <tr><td><b>Sent to Court On</b></td><td>{selectedChallan.sent_to_court_on}</td></tr>
              <tr><td><b>Sent to Reg Court</b></td><td>{selectedChallan.sent_to_reg_court}</td></tr>
              <tr><td><b>Sent to Virtual Court</b></td><td>{selectedChallan.sent_to_virtual_court}</td></tr>
              <tr><td><b>Court Name</b></td><td>{selectedChallan.court_name}</td></tr>
              <tr><td><b>Court Address</b></td><td>{selectedChallan.court_address}</td></tr>
              <tr><td><b>Date of Proceeding</b></td><td>{selectedChallan.date_of_proceeding}</td></tr>
              <tr><td><b>DL No</b></td><td>{selectedChallan.dl_no}</td></tr>
              {selectedChallan.challan_status === 'Disposed' && (
                <>
                  <tr><td><b>Receipt No</b></td><td>{selectedChallan.receipt_no}</td></tr>
                  <tr><td><b>Received Amount</b></td><td>{selectedChallan.received_amount}</td></tr>
                </>
              )}
              <tr><td><b>Fine Imposed</b></td><td>{selectedChallan.fine_imposed}</td></tr>
              <tr><td><b>Amount of Fine Imposed</b></td><td>{selectedChallan.amount_of_fine_imposed}</td></tr>
              <tr><td><b>Act</b></td><td>{Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.length > 0 ? selectedChallan.offence_details[0].act : ''}</td></tr>
              <tr><td><b>Offence Details</b></td><td><ul style={{margin:0,paddingLeft:18}}>{Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.map((o, j) => (<li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>))}</ul></td></tr>
            </tbody>
          </table>
        )}
      </RightSidebar>
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
        // Determine clientId from logged-in user stored in localStorage (sc_user)
        let clientId = null;
        try {
          const stored = JSON.parse(localStorage.getItem('sc_user')) || {};
          if (stored && stored.user) {
            clientId = stored.user.id || stored.user._id || stored.user.client_id || null;
          }
        } catch (e) {
          clientId = null;
        }
        if (!clientId) {
          // If client id not available, avoid making the API call and clear data
          setChallanData({ Disposed_data: [], Pending_data: [] });
          return;
        }
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
        // Sort pending and disposed challans by newest first (based on created_at / createdAt / challan_date_time)
        const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
        allPending.sort((a, b) => {
          const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
          const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
          return (bTime || 0) - (aTime || 0);
        });
        allDisposed.sort((a, b) => {
          const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
          const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
          return (bTime || 0) - (aTime || 0);
        });
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
  // Default to newest-first (created_at descending)
  const [sortAsc, setSortAsc] = useState(false);
  return (
    <div className="my-challans-content">
      <h1 className="page-title">My Challans</h1>
      <p className="page-subtitle">View and manage your Settled and Disposed challans</p>
      <div style={{display:'flex',gap:16,marginBottom:12}}>
        <div className="number-plate-container" style={{ width: 330 }}>
          <div className="number-plate-wrapper">
            <div className="number-plate-badge">IND</div>
            <div className="tricolor-strip">
              <div className="saffron"></div>
              <div className="white"></div>
              <div className="green"></div>
            </div>
            <input
              type="text"
              placeholder="Search Vehicle Number"
              value={search.vehicle}
              onChange={e => setSearch(s => ({ ...s, vehicle: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
              className="number-plate-input"
              maxLength={12}
            />
          </div>
          <div className="security-features">
            <div className="hologram"></div>
            <div className="chakra">⚙</div>
          </div>
        </div>
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
  <ChallanTable title="Disposed Challans" data={challanData.Disposed_data} search={search} sortAsc={sortAsc} />
    </div>
  );
}
