import React, { useState, useEffect, useRef } from "react";
import { ChallanTable } from "./MyChallans";
import ChallanCartModal from "./ChallanCartModal";
import CustomModal from "./CustomModal";
import { FaTrash } from "react-icons/fa";
import "./LatestTable.css";

export default function ChallanSettlement() {
  const [challanData, setChallanData] = useState([]);
  const [sortAsc, setSortAsc] = useState(false);
  const [sortKey, setSortKey] = useState('date');
  const [cart, setCart] = useState([]);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxFineFilter, setMaxFineFilter] = useState(null);
  const [challanTypeFilter, setChallanTypeFilter] = useState({ regCourt: false, virtualCourt: false });
  const [showChallanTypeDropdown, setShowChallanTypeDropdown] = useState(false);
  const challanTypeDropdownRef = useRef(null);

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
        const allPending = [];
        if (Array.isArray(data)) {
          data.forEach(vehicle => {
            if (Array.isArray(vehicle.pending_data)) {
              vehicle.pending_data.forEach(c => {
                allPending.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
          });
        }
        setChallanData(allPending);
      } catch {
        setChallanData([]);
      }
    }
    fetchChallans();
  }, []);

  // Close challan-type dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (challanTypeDropdownRef.current && !challanTypeDropdownRef.current.contains(event.target)) {
        setShowChallanTypeDropdown(false);
      }
    };
    if (showChallanTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChallanTypeDropdown]);

  // Apply same search and filter logic as Vehicle Challans page
  const filteredChallans = Array.isArray(challanData) ? challanData.filter((c) => {
    const term = (searchTerm || "").toLowerCase();
    const hasSearch = term.length > 0;

    const parseFine = (val) => {
      if (val === null || val === undefined || val === "") return Number.NaN;
      const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
      return Number.isNaN(num) ? Number.NaN : num;
    };

    const normalizeCourtFlag = (val) => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim().toLowerCase();
      if (!s || s === '-' || s === 'na' || s === 'n/a') return null;
      if (s === 'no') return false;
      return true;
    };

    const { regCourt, virtualCourt } = challanTypeFilter;

    if (hasSearch) {
      const v = String(c.vehicle_number || "").toLowerCase();
      const n = String(c.challan_no || "").toLowerCase();
      if (!v.includes(term) && !n.includes(term)) return false;
    }

    if (maxFineFilter !== null) {
      const fine = parseFine(c.fine_imposed);
      if (!Number.isNaN(fine) && fine > maxFineFilter) return false;
    }

    if (regCourt || virtualCourt) {
      const regRaw = c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court;
      const virtRaw = c.sent_to_virtual_court ?? c.sent_to_virtual;

      const regFlag = normalizeCourtFlag(regRaw);
      const virtFlag = normalizeCourtFlag(virtRaw);

      let pass = true;
      if (regCourt && !virtualCourt) {
        pass = regFlag === true;
      } else if (!regCourt && virtualCourt) {
        pass = virtFlag === true;
      } else if (regCourt && virtualCourt) {
        pass = regFlag === true || virtFlag === true;
      }

      if (!pass) return false;
    }

    return true;
  }) : [];

  const totalSettlementValue = Array.isArray(filteredChallans)
    ? filteredChallans.reduce((sum, c) => {
        const v = c.fine_imposed;
        if (v === null || v === undefined || v === "") return sum;
        const num = parseFloat(String(v).replace(/[,₹\s]/g, ""));
        return Number.isNaN(num) ? sum : sum + num;
      }, 0)
    : 0;

  // Add to cart logic
  const handleAddToCart = challan => {
    if (!cart.some(c => c.challan_no === challan.challan_no)) {
      setCart([...cart, challan]);
    }
    // Do not open sidebar automatically
  };
  const handleRemoveFromCart = challan => {
    setCart(cart.filter(c => c.challan_no !== challan.challan_no));
  };

  return (
    <div className="dashboard-latest">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{ margin: 0, fontSize: 19, color: '#b26a00', letterSpacing: '0.01em', fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.2, fontWeight: 700 }}>Challan Settlement</h2>
        </div>
        <div
          style={{
            color: '#1b5e20',
            fontSize: 14,
            background: '#e8f5e9',
            border: '1.5px solid #a5d6a7',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 700,
            boxShadow: '0 1px 4px #a5d6a722',
            marginRight: 12,
          }}
        >
          Total Challan Value: {totalSettlementValue.toLocaleString('en-IN')}
        </div>
        <div
          ref={el => {
            if (el && cart.length > 0) {
              // Only set once to avoid jumpiness
              if (!el.dataset.fixed) {
                const rect = el.getBoundingClientRect();
                el.style.position = 'fixed';
                el.style.top = rect.top + window.scrollY + 'px';
                el.style.left = rect.left + window.scrollX + 'px';
                el.style.zIndex = 11000;
                el.style.background = 'rgba(255,255,255,0.95)';
                el.style.borderRadius = '12px';
                el.style.boxShadow = '0 2px 12px #1976d220';
                el.style.padding = '6px 10px';
                el.style.transition = 'box-shadow 0.2s';
                el.dataset.fixed = 'true';
              }
            } else if (el) {
              el.style.position = 'relative';
              el.style.top = '';
              el.style.left = '';
              el.style.zIndex = '';
              el.style.background = '';
              el.style.borderRadius = '';
              el.style.boxShadow = '';
              el.style.padding = '';
              el.style.transition = '';
              el.dataset.fixed = '';
            }
          }}
          style={{ marginLeft: 'auto', marginRight: 0 }}
        >
          {!showCartSidebar && (
            <button
              className="action-btn flat-btn"
              style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, margin: 0, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              title="View Cart"
              onClick={() => setShowCartSidebar(true)}
            >
              <i className="ri-shopping-cart-2-line" style={{ fontSize: 28, color: '#1976d2', verticalAlign: 'middle' }}></i>
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  background: '#ff5252',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: 20,
                  height: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.13)',
                  padding: '0 6px',
                  zIndex: 2
                }}>{cart.length}</span>
              )}
            </button>
          )}
        </div>
      </div>
      {!showCartSidebar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Unified search by Vehicle / Challan No (same style as Vehicle Challans) */}
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
                placeholder="Search by Vehicle / Challan No"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="number-plate-input"
                maxLength={20}
              />
            </div>
            <div className="security-features">
              <div className="hologram"></div>
              <div className="chakra">⚙</div>
            </div>
          </div>

          {/* Fine amount filter as max slider (same behaviour as Vehicle Challans) */}
          {Array.isArray(challanData) && challanData.length > 0 && (() => {
            const fines = challanData
              .map(c => {
                const v = c.fine_imposed;
                if (v === null || v === undefined || v === "") return Number.NaN;
                const num = parseFloat(String(v).replace(/[,₹\s]/g, ""));
                return Number.isNaN(num) ? Number.NaN : num;
              })
              .filter(v => !Number.isNaN(v));
            if (fines.length === 0) return null;
            const maxFine = Math.max(...fines);
            const minFine = Math.min(...fines);
            const effectiveMax = maxFineFilter === null ? maxFine : maxFineFilter;
            return (
              <div className="fine-filter-card">
                <span className="fine-filter-label">Fine up to</span>
                <input
                  type="range"
                  min={minFine}
                  max={maxFine}
                  step={1}
                  value={effectiveMax}
                  onChange={e => setMaxFineFilter(Number(e.target.value))}
                  className="fine-filter-range"
                />
                <span className="fine-filter-value">₹{Math.round(effectiveMax)}</span>
                {maxFineFilter !== null && (
                  <button
                    type="button"
                    onClick={() => setMaxFineFilter(null)}
                    className="fine-filter-reset-btn"
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })()}

          {/* Challan type filter: Registered Court / Virtual Court */}
          <div style={{ position: 'relative' }} ref={challanTypeDropdownRef}>
            <button
              type="button"
              className="filter-select"
              style={{ minWidth: 180, textAlign: 'left', padding: '16px 15px', border: '1px solid #bcd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
              onClick={() => setShowChallanTypeDropdown(v => !v)}
            >
              {(!challanTypeFilter.regCourt && !challanTypeFilter.virtualCourt)
                ? 'Select challan type'
                : [
                    challanTypeFilter.regCourt ? 'Registered court' : null,
                    challanTypeFilter.virtualCourt ? 'Virtual court' : null,
                  ].filter(Boolean).join(', ')}
              {(challanTypeFilter.regCourt || challanTypeFilter.virtualCourt) && (
                <span style={{
                  marginLeft: 8,
                  padding: '0 6px',
                  borderRadius: 999,
                  background: '#fff3e0',
                  color: '#ef6c00',
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {Number(!!challanTypeFilter.regCourt) + Number(!!challanTypeFilter.virtualCourt)}
                </span>
              )}
              <span style={{ float: 'right', fontWeight: 700, fontSize: 16, marginLeft: 8 }}>▼</span>
            </button>
            {showChallanTypeDropdown && (
              <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 10, background: '#fff', border: '1.5px solid #bcd', borderRadius: 8, boxShadow: '0 2px 8px #0001', minWidth: 190, padding: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={challanTypeFilter.regCourt}
                    onChange={(e) =>
                      setChallanTypeFilter(prev => ({ ...prev, regCourt: e.target.checked }))
                    }
                  />
                  Registered court
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={challanTypeFilter.virtualCourt}
                    onChange={(e) =>
                      setChallanTypeFilter(prev => ({ ...prev, virtualCourt: e.target.checked }))
                    }
                  />
                  Virtual court
                </label>
                {(challanTypeFilter.regCourt || challanTypeFilter.virtualCourt) && (
                  <div style={{ textAlign: 'right', marginTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#fff', cursor: 'pointer' }}
                      onClick={() => setChallanTypeFilter({ regCourt: false, virtualCourt: false })}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#f5f8fa', cursor: 'pointer' }}
                      onClick={() => setShowChallanTypeDropdown(false)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
      <ChallanTable
        title="Pending Challans"
        data={filteredChallans}
        search={{ vehicle: '', challan: '' }}
        sortAsc={sortAsc}
        sortKey={sortKey}
        onToggleSort={(key) => {
          if (sortKey === key) {
            setSortAsc((prev) => !prev);
          } else {
            setSortKey(key);
            setSortAsc(false); // default to desc when changing column
          }
        }}
        addToCart={handleAddToCart}
        removeFromCart={handleRemoveFromCart}
        cart={cart}
        settlementMode={true}
        setSelectedChallan={() => {}}
        setSidebarOpen={() => {}}
      />
      {/* Right sidebar cart */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(400px, 100vw)',
          height: '100vh',
          background: 'linear-gradient(120deg, #f5f8fa 60%, #e3eaf1 100%)',
          boxShadow: '0 8px 32px 0 rgba(30,136,229,0.13)',
          zIndex: 9999,
          transition: 'transform 0.35s cubic-bezier(.7,.2,.2,1)',
          transform: showCartSidebar && cart.length > 0 ? 'translateX(0)' : 'translateX(100%)',
          padding: '44px 24px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: 'none',
          borderTopLeftRadius: 22,
          borderBottomLeftRadius: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, margin: 0, color: '#1976d2', fontWeight: 800, letterSpacing: 0.2 }}>Challan Cart <span style={{ color: '#0072ff', fontWeight: 700 }}>({cart.length})</span></h2>
          <button
            className="action-btn flat-btn"
            style={{ background: '#e3eaf1', color: '#1976d2', fontSize: 22, borderRadius: 8, padding: '2px 16px', fontWeight: 700, border: 'none', boxShadow: '0 1px 4px #1976d210' }}
            onClick={() => setShowCartSidebar(false)}
            title="Close Cart Sidebar"
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
          {cart.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40, fontWeight: 600, fontSize: 18 }}>No challans in cart.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {cart.map((c, i) => (
                <li key={c.challan_no} style={{
                  marginBottom: 18,
                  borderBottom: '1.5px solid #e3eaf1',
                  padding: '18px 18px 14px 18px',
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px #1976d210',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#1976d2', letterSpacing: 0.2 }}>{c.challan_no}</div>
                  <div style={{ fontSize: 15, color: '#333', margin: '2px 0 4px 0', fontWeight: 500 }}>₹{c.fine_imposed} <span style={{ color: '#888', fontSize: 13, fontWeight: 400 }}>({c.vehicle_number})</span></div>
                  <button
                    className="action-btn flat-btn"
                    style={{ background: '#e3eaf1', color: '#d32f2f', fontSize: 15, borderRadius: 6, padding: '3px 14px', marginTop: 2, fontWeight: 700, border: 'none', alignSelf: 'flex-end', boxShadow: '0 1px 4px #d32f2f10' }}
                    onClick={() => handleRemoveFromCart(c)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart.length > 0 && (
          <button
            className="action-btn"
            style={{ background: 'linear-gradient(135deg, #0072ff, #00a651)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, fontWeight: 500, cursor: 'pointer', width: '100%' }}
            onClick={() => setShowCartModal(true)}
          >
            Proceed to Settle ({cart.length})
          </button>
        )}
      </div>
      <CustomModal open={showCartModal} onClose={() => setShowCartModal(false)}>
        <div style={{ padding: 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <button
            onClick={() => setShowCartModal(false)}
            style={{position:'absolute',top:16,right:16,background:'none',border:'none',fontSize:28,color:'#888',cursor:'pointer',zIndex:10}}
            title="Close"
            aria-label="Close"
          >×</button>
          <h2 style={{marginBottom:18, fontWeight:700, fontSize:22, color:'#1976d2'}}>Your Challan Cart</h2>
          <div style={{maxWidth:'100%',overflowX:'auto',marginBottom:18}}>
            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,background:'#f8f9fa',borderRadius:8,boxShadow:'0 1px 6px rgba(0,0,0,0.07)'}}>
              <thead>
                <tr style={{background:'#e3e3e3',fontWeight:600,fontSize:16}}>
                  <th style={{padding:'12px 8px',textAlign:'left',verticalAlign:'middle',minWidth:160}}>Vehicle Number</th>
                  <th style={{padding:'12px 8px',textAlign:'left',verticalAlign:'middle',minWidth:10}}>Challan Number</th>
                  <th style={{padding:'12px 8px',textAlign:'right',verticalAlign:'middle',minWidth:120}}>Amount</th>
                  <th style={{padding:'12px 8px',textAlign:'center',verticalAlign:'middle',width:60}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{color:'#888',textAlign:'center',padding:'24px 0'}}>No challans in cart.</td>
                  </tr>
                ) : (
                  cart.map((c) => (
                    <tr key={c.challan_no} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px 8px',textAlign:'left',verticalAlign:'middle',fontWeight:500,fontSize:15,color:'#222'}}>{c.vehicle_number}</td>
                      <td style={{padding:'12px 8px',textAlign:'left',verticalAlign:'middle',fontWeight:500,fontSize:15,color:'#1976d2'}}>{c.challan_no}</td>
                      <td style={{padding:'12px 8px',textAlign:'right',verticalAlign:'middle',fontWeight:500,fontSize:15,color:'#0072ff'}}>₹{c.fine_imposed}</td>
                      <td style={{padding:'12px 8px',textAlign:'center',verticalAlign:'middle'}}>
                        <button
                          className="action-btn flat-btn"
                          style={{background:'none',color:'#ff5252',fontSize:18,border:'none',padding:0,cursor:'pointer'}}
                          title="Remove"
                          onClick={() => handleRemoveFromCart(c)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {cart.length > 0 && (
            <div style={{borderTop:'1px solid #e3e3e3',paddingTop:14,marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:17,fontWeight:600,color:'#222'}}>
                <span>Total Challans:</span>
                <span>{cart.length}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:17,fontWeight:600,color:'#0072ff',marginTop:6}}>
                <span>Total Amount:</span>
                <span>₹{cart.reduce((sum,c)=>sum+Number(c.fine_imposed||0),0)}</span>
              </div>
            </div>
          )}
        </div>
      </CustomModal>
    </div>
  );
}
