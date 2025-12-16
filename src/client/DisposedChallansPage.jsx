import React, { useState, useEffect } from "react";
import RightSidebar from "./RightSidebar";
import QuickActions from "./QuickActions";
// Reuse ChallanTableV2 from MyChallans.jsx

function formatDate(dateStr) {
  if (!dateStr) return '-';
  let d = null;
  if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) d = new Date(dateStr.replace(/-/g, ' '));
  else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) { const [day, month, year] = dateStr.split('-'); d = new Date(`${year}-${month}-${day}`); }
  else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) d = new Date(dateStr);
  else d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
}

function ChallanTableV2({ title, data, onView }) {
  return (
    <div className="dashboard-latest" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(30,136,229,0.07)', border: '1.5px solid #e3eaf1', padding: '0 0 18px 0', marginBottom: 0, minHeight: 340, transition: 'box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{ margin: 0, fontSize: 19, color: '#1565c0', letterSpacing: '0.01em', fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.2, fontWeight: 700 }}>{title}</h2>
        </div>
        <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, display: 'inline-block', marginLeft: 16, boxShadow: '0 1px 4px #21cbf322' }}>
          Showing {data.length} records
        </div>
      </div>
      <div className="table-container">
        <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle No.</th>
              <th>Challan No</th>
              <th>Date/Time</th>
              <th>Location</th>
              <th>Fine Imposed</th>
              <th>Fine Paid</th>
              <th>Status</th>
              <th>Offence Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={10}>No challans found.</td></tr>
            ) : (
              data.map((c, idx) => (
                <tr key={c.challan_no || idx}>
                  <td>{idx + 1}</td>
                  <td>{c.vehicle_number || '-'}</td>
                  <td>{c.challan_no || '-'}</td>
                  <td>{formatDate(c.challan_date_time || c.created_at || c.createdAt)}</td>
                  <td>{c.challan_place || c.location || c.challan_location || c.address || c.owner_address || '-'}</td>
                  <td>{c.fine_imposed ?? '-'}</td>
                  <td>{c.received_amount ?? '-'}</td>
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
                      onClick={() => onView(c)}>
                      <i className="ri-eye-line" style={{fontSize:20}}></i>
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

export default function DisposedChallansPage() {
  const [challanData, setChallanData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  useEffect(() => {
    async function fetchChallans() {
      try {
        const API_ROOT = import.meta.env.VITE_API_BASE_URL;
        if (!API_ROOT) return setChallanData([]);
        let clientId = null;
        try {
          const stored = JSON.parse(localStorage.getItem('sc_user')) || {};
          if (stored && stored.user) {
            clientId = stored.user.id || stored.user._id || stored.user.client_id || null;
          }
        } catch (e) { clientId = null; }
        if (!clientId) return setChallanData([]);
        const url = `${API_ROOT}/getvehicleechallandata?clientId=${clientId}`;
        const res = await fetch(url);
        const data = await res.json();
        const allDisposed = [];
        if (Array.isArray(data)) {
          data.forEach(vehicle => {
            if (Array.isArray(vehicle.disposed_data)) {
              vehicle.disposed_data.forEach(c => {
                allDisposed.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
          });
        }
        allDisposed.sort((a, b) => {
          const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
          const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
          const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
          return (bTime || 0) - (aTime || 0);
        });
        setChallanData(allDisposed);
      } catch (err) {
        setChallanData([]);
      }
    }
    fetchChallans();
  }, []);
  return (
    <div className="my-challans-content">
      <h2 className="page-title">Disposed Challans</h2>
      <p className="page-subtitle">View and manage your Disposed challans</p>
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
      <div style={{marginTop: '18px'}}>
        <ChallanTableV2
          title="Disposed Challans"
          data={challanData}
          onView={c => {
            setSelectedChallan(c);
            setSidebarOpen(true);
          }}
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
              <tr><td><b>Receipt No</b></td><td>{selectedChallan.receipt_no}</td></tr>
              <tr><td><b>Received Amount</b></td><td>{selectedChallan.received_amount}</td></tr>
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
