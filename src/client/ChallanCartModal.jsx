import React, { useEffect, useState } from "react";

export default function ChallanCartModal({ open, cart, onClose, onRemove }) {
  const ONLINE_FEE = Number(import.meta.env.VITE_ONLINE_CHALLAN_FEE || 170);
  const VIRTUAL_COURT_FEE = Number(import.meta.env.VITE_VIRTUAL_COURT_FEE || 499);
  const REGISTERED_COURT_FEE = Number(import.meta.env.VITE_REGISTERED_COURT_FEE || 899);
  const GST_PERCENT = Number(import.meta.env.VITE_CHALLAN_GST_PERCENT || 18);

  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (open) {
      setShowPayment(false);
      setTransactionId("");
    }
  }, [open, cart.length]);

  const formatDateTime = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const submitCartRequest = async () => {
    const API_ROOT = import.meta.env.VITE_API_BASE_URL;
    if (!API_ROOT) {
      alert("API base URL is not configured. Please contact support.");
      return;
    }

    let clientId = null;
    let dealerId = null;
    let adminId = null;
    try {
      const stored = JSON.parse(localStorage.getItem("sc_user")) || {};
      if (stored && stored.user) {
        const u = stored.user;
        clientId = u.client_id || u.id || u._id || null;
        dealerId = u.dealer_id || null;
        adminId = u.admin_id || null;
      }
    } catch (e) {
      // ignore, will send null ids
    }

    const timestamp = formatDateTime();

    const lineItems = cart.map((c) => {
      const base = parseAmount(c.fine_imposed);
      const fee = getServiceFee(c);
      const gstAmt = (fee * GST_PERCENT) / 100;
      const rawType = getChallanType(c); // 'online' | 'registered' | 'virtual'
      let challanType = "online";
      if (rawType === "virtual") challanType = "virtual";
      else if (rawType === "registered") challanType = "court";

      return {
        vehicle_number: c.vehicle_number,
        challan_number: c.challan_no,
        challan_type: challanType,
        challan_amount: base,
        discount: 0,
        discount_code: "0",
        service_fee: fee,
        gst_percent: GST_PERCENT,
        gst_amt: gstAmt,
      };
    });

    const payload = {
      client_id: clientId,
      dealer_id: dealerId,
      admin_id: adminId,
      request_type: "challan",
      item_count: cart.length,
      line_items: lineItems,
      status: "pending",
      last_updated_by: "client",
      created_at: timestamp,
      updated_at: timestamp,
    };

    try {
      const res = await fetch(`${API_ROOT}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      // Successfully created cart request, move to payment/QR step
      setShowPayment(true);
    } catch (err) {
      console.error("Failed to submit cart request", err);
      alert("Failed to submit request. Please try again.");
    }
  };

  const handleSubmit = () => {
    if (!transactionId.trim()) {
      alert("Please enter the UPI transaction / reference ID.");
      return;
    }

    alert("Thank you. We have recorded your transaction ID and will verify the payment shortly.");
    if (typeof onClose === "function") onClose();
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

    if (!open) {
      return null;
    }

    return (
      <div className="custom-modal-overlay">
        <div className="custom-modal">
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <div className="custom-modal-content">
        <h2>
          {showPayment
            ? "Congrats, we have received your challan settlement request."
            : `Challan Cart (${cart.length})`}
        </h2>
        <div style={{ lineHeight: 1.7, fontSize: 15 }}>
          {cart.length === 0 ? (
            <div>No challans in cart.</div>
          ) : (
            <>
              <div style={{ maxHeight: 260, overflowY: 'auto', marginTop: 8 }}>
                <table className="latest-table" style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Challan No</th>
                      <th>Vehicle No.</th>
                      <th>Type</th>
                      <th>Challan Amount</th>
                      <th>Service Fee</th>
                      <th>GST @{GST_PERCENT}%</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c) => {
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
                      return (
                        <tr key={c.challan_no}>
                          <td>{c.challan_no}</td>
                          <td>{c.vehicle_number}</td>
                          <td>{label}</td>
                          <td>₹{base.toLocaleString('en-IN')}</td>
                          <td>₹{fee.toLocaleString('en-IN')}</td>
                          <td>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td>
                            <button
                              className="action-btn flat-btn"
                              style={{ background: '#eee', color: '#e53935', fontSize: 16, padding: '2px 6px' }}
                              type="button"
                              title="Remove from cart"
                              onClick={() => onRemove && onRemove(c)}
                            >
                              <i className="ri-delete-bin-line" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total challans</span>
                  <span>{cart.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Total challan amount</span>
                  <span>₹{cartTotals.base.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Total service fee</span>
                  <span>₹{cartTotals.fee.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Total GST @ {GST_PERCENT}%</span>
                  <span>₹{cartTotals.gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontWeight: 600 }}>
                  <span>Grand total</span>
                  <span>₹{cartTotals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              {!showPayment && (
                <button
                  className="action-btn"
                  type="button"
                  style={{ marginTop: 16, width: '100%' }}
                  onClick={submitCartRequest}
                >
                  Submit Request
                </button>
              )}
              {showPayment && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #e3eaf1',
                    background: '#f5f8fa',
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        padding: 8,
                        background: '#fff',
                        borderRadius: 8,
                        border: '1px solid #ddd',
                      }}
                    >
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=demo@upi&pn=Smart%20Challan&am=1.00&cu=INR"
                        alt="Sample UPI QR code"
                        width={180}
                        height={180}
                        style={{ display: 'block' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <p style={{ marginTop: 0, marginBottom: 6 }}>
                        Scan this sample QR in any UPI app to make payment for your selected challans.
                      </p>
                      <p style={{ fontSize: 12, color: '#777', marginTop: 0, marginBottom: 10 }}>
                        After making the payment, enter your UPI transaction / reference ID below and submit your request so our team can verify and mark the challans as paid.
                      </p>
                      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Transaction / UPI Reference ID
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid #cfd8e3',
                          fontSize: 14,
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        className="action-btn"
                        type="button"
                        style={{ marginTop: 10 }}
                        onClick={handleSubmit}
                      >
                        Submit Request
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
