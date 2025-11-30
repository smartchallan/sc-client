import React, { useState, useEffect } from "react";
import { ChallanTable } from "./MyChallans";
import ChallanCartModal from "./ChallanCartModal";

export default function ChallanSettlement() {
  const [challanData, setChallanData] = useState([]);
  const [search, setSearch] = useState({ vehicle: '', challan: '' });
  const [sortAsc, setSortAsc] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCartSidebar, setShowCartSidebar] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <h2 style={{ margin: 0 }}>Challan Settlement</h2>
        <div style={{ position: 'relative', marginLeft: 16, marginRight: 2 }}>
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
        </div>
      </div>
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
      <ChallanTable
        title="Pending Challans"
        data={challanData}
        search={search}
        sortAsc={sortAsc}
  addToCart={handleAddToCart}
  removeFromCart={handleRemoveFromCart}
  cart={cart}
  settlementMode={true}
      />
      {/* Right sidebar cart */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: showCartSidebar && cart.length > 0 ? 0 : '-380px',
          width: 360,
          height: '100vh',
          background: '#fff',
          boxShadow: '0 0 24px rgba(0,0,0,0.13)',
          zIndex: 1200,
          transition: 'right 0.35s cubic-bezier(.7,.2,.2,1)',
          padding: '28px 24px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '2px solid #e3e3e3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Challan Cart <span style={{ color: '#0072ff' }}>({cart.length})</span></h2>
          <button
            className="action-btn flat-btn"
            style={{ background: '#eee', color: '#1976d2', fontSize: 18, borderRadius: 6, padding: '2px 12px', fontWeight: 700 }}
            onClick={() => setShowCartSidebar(false)}
            title="Close Cart Sidebar"
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
          {cart.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No challans in cart.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {cart.map((c, i) => (
                <li key={c.challan_no} style={{ marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#1976d2' }}>{c.challan_no}</div>
                  <div style={{ fontSize: 15, color: '#333', margin: '2px 0 4px 0' }}>₹{c.fine_imposed} <span style={{ color: '#888', fontSize: 13 }}>({c.vehicle_number})</span></div>
                  <button
                    className="action-btn flat-btn"
                    style={{ background: '#eee', color: '#1976d2', fontSize: 13, borderRadius: 5, padding: '2px 10px', marginTop: 2 }}
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
            onClick={() => alert('Proceed to settlement/payment (not implemented)')}
          >
            Proceed to Settle ({cart.length})
          </button>
        )}
      </div>
    </div>
  );
}
