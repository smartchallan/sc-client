import React, { useEffect, useState, useRef } from "react";
import { ChallanTableV2, handleChallanPrint, handleChallanDownloadExcel } from "./MyChallans";
import RightSidebar from "./RightSidebar";
import ChallanCartModal from "./ChallanCartModal";

export default function PayChallans({ showClientPages = false }) {
  const ONLINE_FEE = Number(import.meta.env.VITE_ONLINE_CHALLAN_FEE || 170);
  const VIRTUAL_COURT_FEE = Number(import.meta.env.VITE_VIRTUAL_COURT_FEE || 499);
  const REGISTERED_COURT_FEE = Number(import.meta.env.VITE_REGISTERED_COURT_FEE || 899);
  const GST_PERCENT = Number(import.meta.env.VITE_CHALLAN_GST_PERCENT || 18);

  const [pendingChallans, setPendingChallans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  
  // Client selection state for Client mode
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientList, setClientList] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  
  // Load clients from localStorage when in Client mode
  useEffect(() => {
    if (showClientPages) {
      try {
        const cachedData = localStorage.getItem('client_network');
        if (cachedData) {
          const data = JSON.parse(cachedData);
          const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          
          // Flatten nested children (same logic as MyFleetTable)
          const flattenChildren = (node, dealerName = null) => {
            const result = [];
            result.push({ ...node, dealerName, isParent: !dealerName });
            if (Array.isArray(node.children) && node.children.length > 0) {
              node.children.forEach(child => {
                result.push(...flattenChildren(child, node.name));
              });
            }
            return result;
          };
          
          const flatClients = [];
          rawData.forEach(parent => {
            flatClients.push(...flattenChildren(parent));
          });
          
          setClientList(flatClients);
        }
      } catch (e) {
        console.error('Failed to load client list:', e);
      }
    }
  }, [showClientPages]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showClientPages) return;
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientPages]);
  
  const selectedClientName = clientList.find(c => (c.id || c._id) === selectedClientId)?.name || '';

  useEffect(() => {
    const handleToggle = () => {
      setCartSidebarOpen(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("challan-cart-toggle", handleToggle);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("challan-cart-toggle", handleToggle);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchChallans() {
      // Don't fetch if in client mode and no client is selected
      if (showClientPages && !selectedClientId) {
        setPendingChallans([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const API_ROOT = import.meta.env.VITE_API_BASE_URL;
        if (!API_ROOT) {
          throw new Error("VITE_API_BASE_URL is not set. Please check your .env file and restart the dev server.");
        }
        // Determine clientId from selected client or logged-in user
        let clientId = null;
        if (showClientPages && selectedClientId) {
          clientId = selectedClientId;
        } else {
          try {
            const stored = JSON.parse(localStorage.getItem("sc_user")) || {};
            if (stored && stored.user) {
              clientId = stored.user.id || stored.user._id || stored.user.client_id || null;
            }
          } catch (e) {
            clientId = null;
          }
        }
        if (!clientId) {
          setPendingChallans([]);
          setIsLoading(false);
          return;
        }
        const url = `${API_ROOT}/getvehicleechallandata?clientId=${clientId}`;
        const res = await fetch(url);
        const data = await res.json();
        const allPending = [];
        if (Array.isArray(data)) {
          data.forEach((vehicle) => {
            if (Array.isArray(vehicle.pending_data)) {
              vehicle.pending_data.forEach((c) => {
                allPending.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
          });
        }
        const parseDate = (s) =>
          s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3")).getTime() : 0;
        allPending.sort((a, b) => {
          const aTime = parseDate(a.challan_date_time);
          const bTime = parseDate(b.challan_date_time);
          return (bTime || 0) - (aTime || 0);
        });
        setPendingChallans(allPending);
      } catch (err) {
        setPendingChallans([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChallans();
  }, [showClientPages, selectedClientId]);

  const addToCart = (challan) => {
    setCart((prev) => {
      if (prev.some((c) => c.challan_no === challan.challan_no)) return prev;
      return [...prev, challan];
    });
  };

  const removeFromCart = (challan) => {
    setCart((prev) => prev.filter((c) => c.challan_no !== challan.challan_no));
  };

  const parseAmount = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
    return Number.isNaN(num) ? 0 : num;
  };

  const normalizeCourtFlag = (val) => {
    if (val === null || val === undefined) return null;
    const s = String(val).trim().toLowerCase();
    if (!s || s === "-" || s === "na" || s === "n/a") return null;
    if (s === "no" || s === "0" || s === "false") return false;
    return true;
  };

  const getChallanType = (c) => {
    const regRaw = c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court;
    const virtRaw = c.sent_to_virtual_court ?? c.sent_to_virtual;
    const regFlag = normalizeCourtFlag(regRaw);
    const virtFlag = normalizeCourtFlag(virtRaw);
    if (virtFlag === true) return "virtual";
    if (regFlag === true) return "registered";
    return "online";
  };

  const getServiceFee = (c) => {
    const type = getChallanType(c);
    if (type === "virtual") return VIRTUAL_COURT_FEE;
    if (type === "registered") return REGISTERED_COURT_FEE;
    return ONLINE_FEE;
  };

  const cartTotals = cart.reduce(
    (acc, c) => {
      const base = parseAmount(c.fine_imposed);
      const fee = getServiceFee(c);
      const gst = (fee * GST_PERCENT) / 100;
      acc.base += base;
      acc.fee += fee;
      acc.gst += gst;
      acc.total += base + fee + gst;
      return acc;
    },
    { base: 0, fee: 0, gst: 0, total: 0 }
  );

  return (
    <div className="my-challans-content">
      {/* Loader styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Full-page loader when fetching client challans */}
      {showClientPages && isLoading && selectedClientId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '48px 56px',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 12px 48px rgba(33, 150, 243, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '2px solid #2196f3',
            minWidth: 380,
            maxWidth: 480
          }}>
            <div style={{
              width: 72,
              height: 72,
              border: '5px solid #e3f2fd',
              borderTop: '5px solid #2196f3',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
              margin: '0 auto 28px'
            }} />
            <div style={{ 
              fontSize: 22, 
              fontWeight: 600, 
              color: '#1565c0', 
              marginBottom: 10,
              letterSpacing: '-0.3px',
              lineHeight: 1.3
            }}>
              Fetching challans for {selectedClientName}
            </div>
            <div style={{ 
              fontSize: 15, 
              color: '#666',
              fontWeight: 400,
              lineHeight: 1.5
            }}>
              Please wait...
            </div>
          </div>
        </div>
      )}
      
      <p className="page-subtitle">
        {showClientPages 
          ? "Select a client to view their vehicle challans for settlement" 
          : "Select vehicle challans for challan settlement and add them to your cart."
        }
      </p>
      
      {/* Client selector dropdown for Client mode */}
      {showClientPages && (
        <div style={{ marginBottom: 20, padding: '0 0'}}>
          <div style={{ position: 'relative', maxWidth: 650 }} ref={clientDropdownRef}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600, 
              color: '#1565c0', 
              fontSize: 15,
              letterSpacing: '-0.2px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Select Client
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name, company, or email..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                onFocus={() => setShowClientDropdown(true)}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 18px',
                  border: '2px solid #2196f3',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.08)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = '#1976d2'}
                onMouseLeave={(e) => e.target.style.borderColor = '#2196f3'}
              />
              {clientSearchTerm && (
                <button
                  onClick={() => {
                    setClientSearchTerm('');
                    setSelectedClientId(null);
                    setShowClientDropdown(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#e3f2fd',
                    color: '#1565c0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#1565c0';
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#e3f2fd';
                    e.target.style.color = '#1565c0';
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {showClientDropdown && clientList.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                maxHeight: 360,
                overflowY: 'auto',
                background: '#fff',
                border: '2px solid #2196f3',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08)',
                zIndex: 1000,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {clientList
                  .filter(client => {
                    const searchLower = clientSearchTerm.toLowerCase();
                    const name = client.name || '';
                    const email = client.email || '';
                    const company = (client.user_meta || client.userMeta)?.company_name || '';
                    return name.toLowerCase().includes(searchLower) || 
                           email.toLowerCase().includes(searchLower) ||
                           company.toLowerCase().includes(searchLower);
                  })
                  .map(client => (
                    <div
                      key={client.id || client._id}
                      onClick={() => {
                        setSelectedClientId(client.id || client._id);
                        setClientSearchTerm(`${client.name} (${(client.user_meta || client.userMeta)?.company_name || 'N/A'})`);
                        setShowClientDropdown(false);
                      }}
                      style={{
                        padding: '14px 18px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e8f4fd',
                        background: (client.id || client._id) === selectedClientId ? '#e3f2fd' : '#fff',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientId ? '#bbdefb' : '#f5f9fc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientId ? '#e3f2fd' : '#fff'}
                    >
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#1565c0', 
                        fontSize: 15,
                        marginBottom: 4,
                        letterSpacing: '-0.2px'
                      }}>{client.name}</div>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#666', 
                        lineHeight: 1.4
                      }}>
                        {(client.user_meta || client.userMeta)?.company_name || 'N/A'} • {client.email || 'N/A'}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {showClientPages && !selectedClientId ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: '#f5f9fc',
            borderRadius: 12,
            border: '2px dashed #bbdefb',
            marginTop: 18
          }}
        >
          <div style={{ textAlign: 'center', color: '#666', fontSize: 15 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1565c0', marginBottom: 8 }}>
              No Client Selected
            </div>
            Please select a client from the dropdown above to view their vehicle challans.
          </div>
        </div>
      ) : isLoading ? (
        <div style={{ marginTop: 32, textAlign: "center", color: "#555", fontSize: 14 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "#f5f8ff",
              border: "1px solid #c5d0ff",
            }}
          >
            <span
              className="spinner-border"
              style={{
                width: 16,
                height: 16,
                border: "2px solid #90a4ff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span>Loading vehicle challans - please wait...</span>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18 }}>
          <ChallanTableV2
            title="Challan Settlement"
            data={pendingChallans}
            settlementMode={true}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            cart={cart}
            onView={(c) => {
              setSelectedChallan(c);
              setSidebarOpen(true);
            }}
            onClickDownload={(rows) => handleChallanDownloadExcel(Array.isArray(rows) ? rows : pendingChallans)}
            onClickPrint={(rows) => { if (typeof handleChallanPrint === 'function') handleChallanPrint(rows); }}
          />
        </div>
      )}

      {sidebarOpen && selectedChallan && (
        <RightSidebar
          open={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setTimeout(() => setSelectedChallan(null), 300);
          }}
          title={selectedChallan ? `Challan Details: ${selectedChallan.challan_no}` : "Challan Details"}
        >
          <table className="latest-table" style={{ width: "100%", fontSize: 15 }}>
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
              <tr><td><b>Fine Imposed</b></td><td>{selectedChallan.fine_imposed}</td></tr>
              <tr><td><b>Amount of Fine Imposed</b></td><td>{selectedChallan.amount_of_fine_imposed}</td></tr>
              {Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.length > 0 && (
                <tr>
                  <td><b>Offence Details</b></td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {selectedChallan.offence_details.map((o, j) => (
                        <li key={j} className="cell-ellipsis" title={o.name}>
                          <div><b>Name:</b> {o.name}</div>
                          {o.act && <div><b>Act:</b> {o.act}</div>}
                          {o.section && <div><b>Section:</b> {o.section}</div>}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </RightSidebar>
      )}

      {cartSidebarOpen && (
        <RightSidebar
          open={cartSidebarOpen}
          onClose={() => setCartSidebarOpen(false)}
          title={`Challan Cart`}
        >
          {cart.length === 0 ? (
            <div style={{ 
              padding: 40, 
              textAlign: 'center',
              color: '#666' 
            }}>
              <i className="ri-shopping-cart-line" style={{ 
                fontSize: 64, 
                color: '#cbd5e1',
                display: 'block',
                marginBottom: 16 
              }}></i>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                Your cart is empty
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8' }}>
                Add challans from the table to get started
              </div>
            </div>
          ) : (
            <>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '16px 20px',
                margin: '-16px -20px 16px -20px',
                borderRadius: '0',
                color: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>
                      {cart.length} {cart.length === 1 ? 'challan' : 'challans'} selected
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                      ₹{cartTotals.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <i className="ri-shopping-cart-2-fill" style={{ fontSize: 48, opacity: 0.2 }}></i>
                </div>
              </div>

              <div style={{ 
                marginBottom: 16 
              }}>
                {cart.map((c, index) => {
                  const base = parseAmount(c.fine_imposed);
                  const fee = getServiceFee(c);
                  const gst = (fee * GST_PERCENT) / 100;
                  const lineTotal = base + fee + gst;
                  const type = getChallanType(c);
                  const label =
                    type === "virtual"
                      ? "Virtual Court"
                      : type === "registered"
                      ? "Registered Court"
                      : "Online";
                  
                  const typeColor = 
                    type === "virtual" ? "#9333ea" : 
                    type === "registered" ? "#dc2626" : 
                    "#0891b2";
                  
                  const typeBg = 
                    type === "virtual" ? "#faf5ff" : 
                    type === "registered" ? "#fef2f2" : 
                    "#ecfeff";

                  return (
                    <div
                      key={c.challan_no}
                      style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 12,
                        position: 'relative',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ 
                        position: 'absolute',
                        top: 10,
                        right: 10
                      }}>
                        <button
                          className="action-btn flat-btn"
                          style={{ 
                            background: '#fee',
                            color: '#dc2626',
                            fontSize: 16,
                            padding: '6px 8px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          type="button"
                          title="Remove from cart"
                          onClick={() => removeFromCart(c)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fee';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>

                      <div style={{ 
                        display: 'inline-block',
                        background: typeBg,
                        color: typeColor,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: 10
                      }}>
                        {label}
                      </div>

                      <div style={{ 
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#1e293b',
                        marginBottom: 6,
                        paddingRight: 40
                      }}>
                        {c.challan_no}
                      </div>

                      <div style={{ 
                        fontSize: 13,
                        color: '#64748b',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <i className="ri-car-line" style={{ fontSize: 14 }}></i>
                        {c.vehicle_number}
                      </div>

                      <div style={{ 
                        background: '#f8fafc',
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 13
                      }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                          color: '#475569'
                        }}>
                          <span>Challan Amount</span>
                          <span style={{ fontWeight: 600 }}>₹{base.toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                          color: '#475569'
                        }}>
                          <span>Service Fee</span>
                          <span style={{ fontWeight: 600 }}>₹{fee.toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                          color: '#475569'
                        }}>
                          <span>GST @ {GST_PERCENT}%</span>
                          <span style={{ fontWeight: 600 }}>₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          paddingTop: 8,
                          borderTop: '1px dashed #cbd5e1',
                          marginTop: 4,
                          color: '#0f172a',
                          fontSize: 14
                        }}>
                          <span style={{ fontWeight: 700 }}>Total</span>
                          <span style={{ fontWeight: 700, color: '#0891b2' }}>
                            ₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ 
                background: '#f8fafc',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 12
                }}>
                  Summary
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>Challan Amount</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartTotals.base.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>Service Fee</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartTotals.fee.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>GST @ {GST_PERCENT}%</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartTotals.gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: '2px solid #cbd5e1',
                  fontSize: 16
                }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Grand Total</span>
                  <span style={{ fontWeight: 700, color: '#0891b2' }}>
                    ₹{cartTotals.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="action-btn flat-btn"
                  type="button"
                  style={{ 
                    flex: 1,
                    background: "#fff",
                    color: "#64748b",
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isSubmittingCart ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingCart ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  onClick={() => !isSubmittingCart && setCart([])}
                  disabled={isSubmittingCart}
                  onMouseEnter={(e) => {
                    if (!isSubmittingCart) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <i className="ri-delete-bin-6-line" style={{ marginRight: 6 }}></i>
                  Clear Cart
                </button>
                <button
                  className="action-btn"
                  type="button"
                  style={{ 
                    flex: 2,
                    background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isSubmittingCart ? 'wait' : 'pointer',
                    opacity: isSubmittingCart ? 0.8 : 1,
                    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (!isSubmittingCart) setCartModalOpen(true);
                  }}
                  disabled={isSubmittingCart}
                  onMouseEnter={(e) => {
                    if (!isSubmittingCart) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 145, 178, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)';
                  }}
                >
                  {isSubmittingCart ? (
                    <>
                      <i className="ri-loader-4-line" style={{ marginRight: 6, animation: 'spin 1s linear infinite' }}></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="ri-secure-payment-line" style={{ marginRight: 6 }}></i>
                      Proceed to Settlement
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </RightSidebar>
      )}

      <ChallanCartModal
        open={cartModalOpen}
        cart={cart}
        onClose={() => setCartModalOpen(false)}
        onRemove={removeFromCart}
        onSubmittingChange={setIsSubmittingCart}
        onCartSubmitted={() => {
          setCart([]);
          setCartSidebarOpen(false);
        }}
      />
    </div>
  );
}
