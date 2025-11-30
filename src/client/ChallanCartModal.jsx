import React from "react";

export default function ChallanCartModal({ open, cart, onClose, onRemove }) {
  return (
    <div className={`custom-modal${open ? ' open' : ''}`}> 
      <div className="custom-modal-content">
        <h2>Challan Cart ({cart.length})</h2>
        <div style={{ lineHeight: 1.7, fontSize: 15 }}>
          {cart.length === 0 ? (
            <div>No challans in cart.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {cart.map((c, i) => (
                <li key={c.challan_no} style={{ marginBottom: 8 }}>
                  <b>{c.challan_no}</b> - ₹{c.fine_imposed} ({c.vehicle_number})
                  <button className="action-btn flat-btn" style={{ marginLeft: 12, background: '#eee', color: '#1976d2', fontSize: 13, padding: '2px 8px' }} onClick={() => onRemove(c)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="action-btn" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
