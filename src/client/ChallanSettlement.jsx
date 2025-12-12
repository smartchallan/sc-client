import React, { useState, useEffect } from "react";
import { ChallanTable } from "./MyChallans";
import ChallanCartModal from "./ChallanCartModal";
import CustomModal from "./CustomModal";
import { FaTrash } from "react-icons/fa";

export default function ChallanSettlement() {
  const [challanData, setChallanData] = useState([]);
  const [search, setSearch] = useState({ vehicle: '', challan: '' });
  const [sortAsc, setSortAsc] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 0, width: '100%' }}>
        {/* <h2 style={{ margin: 0 }}>Challan Settlement</h2> */}
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
          {/* Cart sidebar trigger is not needed, sidebar will show automatically */}
        </div>
      )}
      <ChallanTable
        title="Pending Challans"
        data={challanData}
        search={search}
        sortAsc={sortAsc}
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
          right: showCartSidebar && cart.length > 0 ? 0 : '-400px',
          width: 400,
          height: '100vh',
          background: 'linear-gradient(120deg, #f5f8fa 60%, #e3eaf1 100%)',
          boxShadow: '0 8px 32px 0 rgba(30,136,229,0.13)',
          zIndex: 9999,
          transition: 'right 0.35s cubic-bezier(.7,.2,.2,1)',
          padding: '44px 36px 36px 36px',
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
        <div style={{padding:24, minWidth:700, maxWidth:900, position:'relative'}}>
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
