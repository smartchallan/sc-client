import "./LatestTable.css";

import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import RightSidebar from "./RightSidebar";
import QuickActions from "./QuickActions";
import "./RightSidebar.css";
import "../RegisterVehicle.css";

// ...existing code...
export function ChallanTable({ title, data, search = {}, sortAsc = true, addToCart, removeFromCart, cart, showCart, setShowCart, settlementMode, sidebarOpen, setSidebarOpen, setSelectedChallan }) {
  // Utility to format Reg Court values
  function formatRegCourtValue(v) {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '-';
      if (s.toLowerCase() === 'yes' || s.toLowerCase() === 'no') return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      // If it's a date-like string, shorten to YYYY-MM-DD or first 10 chars
      if (/\d{4}-\d{2}-\d{2}/.test(s) || /\d{2}-\d{2}-\d{4}/.test(s) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(s)) return s.length > 10 ? s.slice(0, 10) : s;
      return s;
    }
    return String(v);
  }
  // Filter and sort logic for table
  const [visibleCount, setVisibleCount] = useState(10);
  const [infoModal, setInfoModal] = useState({ open: false, message: '' });
  const filtered = Array.isArray(data)
    ? data.filter(c => {
        const vehicleMatch = search.vehicle ? String(c.vehicle_number || '').toUpperCase().includes(search.vehicle.toUpperCase()) : true;
        const challanMatch = search.challan ? String(c.challan_no || '').toUpperCase().includes(search.challan.toUpperCase()) : true;
        return vehicleMatch && challanMatch;
      })
    : [];
  const sorted = [...filtered].sort((a, b) => {
    const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
    const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
    const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
    return sortAsc ? aTime - bTime : bTime - aTime;
  });
  const limited = sorted.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount; 
  const [showFull, setShowFull] = useState({});
  // sidebarOpen and setSidebarOpen are now passed from parent
  const DEFAULT_LIMIT = 10;
  return (
    <div>
      <div className="modern-table-container">
        <div className="modern-table-header">
          <h2>{title} <span className="modern-table-count">({filtered.length})</span></h2>
          {filtered.length > 0 && (
            <div className="modern-table-caption">
              Showing {Math.min(filtered.length, visibleCount)} of {filtered.length} challans
            </div>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="modern-table-empty">No challans found.</div>
        ) : (
          <>
            <table className="latest-table" style={{width: '100%'}}>
              <thead>
                <tr>
                  {settlementMode && <th></th>}
                  <th>#</th>
                  <th>Vehicle No.</th>
                  <th>Challan No</th>
                  <th>Date/Time</th>
                  <th>Location</th>
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
                    {settlementMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={cart && cart.some(s => s.challan_no === c.challan_no)}
                          onChange={() => (cart && cart.some(s => s.challan_no === c.challan_no) ? removeFromCart(c) : addToCart(c))}
                        />
                      </td>
                    )}
                    <td>{idx + 1}</td>
                    <td>{c.vehicle_number || '-'}</td>
                    <td>{c.challan_no || '-'}</td>
                    <td>{c.challan_date_time || c.created_at || c.createdAt}</td>
                    <td>
                      {(() => {
                        const loc = c.challan_place || c.location || c.challan_location || c.address || c.owner_address;
                        if (loc && typeof loc === 'string' && loc.trim()) {
                          return (
                            <span
                              className="modern-table-map"
                              title={loc}
                              onClick={() => {
                                setInfoModal({
                                  open: true,
                                  message: (
                                    <iframe
                                      title="Google Maps"
                                      width="910"
                                      height="500"
                                      style={{ border: 0, borderRadius: 12 }}
                                      src={`https://www.google.com/maps?q=${encodeURIComponent(loc)}&output=embed`}
                                      allowFullScreen
                                    />
                                  )
                                });
                              }}
                              style={{ cursor: 'pointer', color: '#4285F4', fontSize: 20, verticalAlign: 'middle' }}
                            >
                              <i className="ri-map-pin-2-fill" />
                            </span>
                          );
                        }
                        return 'Not Available';
                      })()}
                    </td>
                    {title && title.toLowerCase().includes('pending') && (
                      <td>{formatRegCourtValue(c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court)}</td>
                    )}
                    {title && title.toLowerCase().includes('pending') && (
                      <td>{formatRegCourtValue(c.sent_to_virtual_court ?? c.sent_to_virtual)}</td>
                    )}
                    <td>{c.fine_imposed}</td>
                    {title && title.toLowerCase().includes('disposed') && (
                      <td>{c.received_amount ?? '-'}</td>
                    )}
                    <td>
                      <span className={`modern-table-status ${c.challan_status === 'Pending' ? 'pending' : c.challan_status === 'Disposed' ? 'paid' : ''}`}>{c.challan_status}</span>
                    </td>
                    <td>
                      <ul className="modern-table-offence-list">
                        {Array.isArray(c.offence_details) && c.offence_details.map((o, i) => (
                          <li key={i} className="cell-ellipsis" title={o.name}>{o.name}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <button
                        className="action-btn flat-btn"
                        onClick={() => {
                          setSelectedChallan(c);
                          setSidebarOpen(true);
                        }}>
                        <i className="ri-eye-line" style={{marginRight:4}}></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="modern-table-showmore">
                <button className="action-btn flat-btn" onClick={() => setVisibleCount(v => v + DEFAULT_LIMIT)}>
                  Show More
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <CustomModal
        open={infoModal.open}
        title={infoModal.message}
        onConfirm={() => setInfoModal({ open: false, message: '' })}
        onCancel={() => setInfoModal({ open: false, message: '' })}
        confirmText="OK"
        cancelText={null}
      />
    </div>
  );
}
export default function MyChallans() {
  const [challanData, setChallanData] = useState({ Disposed_data: [], Pending_data: [] });
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [selectedChallan, setSelectedChallan] = useState(null);
  return (
    <div className="my-challans-content">
      <h1 className="page-title">My Challans</h1>
      <p className="page-subtitle">View and manage your Settled and Disposed challans</p>
      {!sidebarOpen && (
        <div className="main-quick-actions-wrapper">
          <QuickActions
            title="Quick Actions"
            sticky={true}
            onAddVehicle={() => {}}
            onBulkUpload={() => {}}
            onPay={() => {}}
            onReports={() => {}}
            onContact={() => {}}
          />
        </div>
      )}
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
      <div style={{marginTop: '18px'}}>
        <ChallanTable
          title="Pending Challans"
          data={challanData.Pending_data}
          search={search}
          sortAsc={sortAsc}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setSelectedChallan={setSelectedChallan}
        />
        <ChallanTable
          title="Disposed Challans"
          data={challanData.Disposed_data}
          search={search}
          sortAsc={sortAsc}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setSelectedChallan={setSelectedChallan}
        />
      </div>
      {sidebarOpen && selectedChallan && (
        <RightSidebar
          open={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setTimeout(() => setSelectedChallan(null), 300);
          }}
          title={selectedChallan ? `Challan Details: ${selectedChallan.challan_no}` : "Challan Details"}
        >
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
        </RightSidebar>
      )}
    </div>
  );
}
