import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function ChallanCartModal({ open, cart, onClose, onRemove, onSubmittingChange, onCartSubmitted }) {
  const ONLINE_FEE = Number(import.meta.env.VITE_ONLINE_CHALLAN_FEE || 170);
  const VIRTUAL_COURT_FEE = Number(import.meta.env.VITE_VIRTUAL_COURT_FEE || 499);
  const REGISTERED_COURT_FEE = Number(import.meta.env.VITE_REGISTERED_COURT_FEE || 899);
  const GST_PERCENT = Number(import.meta.env.VITE_CHALLAN_GST_PERCENT || 18);

  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  useEffect(() => {
    if (typeof onSubmittingChange === 'function') {
      onSubmittingChange(isSubmittingCart || isSubmittingTxn);
    }
  }, [isSubmittingCart, isSubmittingTxn, onSubmittingChange]);

  useEffect(() => {
    if (open) {
      setShowPayment(false);
      setTransactionId("");
      setRequestId(null);
      setIsSubmittingCart(false);
      setIsSubmittingTxn(false);
      setTransactionError("");
    }
  }, [open]);

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
      toast.error("API base URL is not configured. Please contact support.");
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
    };

    try {
      setIsSubmittingCart(true);
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
      try {
        const data = await res.json();
        const nested = data && data.data ? data.data : data;
        if (nested && (nested.request_id || nested.id)) {
          setRequestId(nested.request_id || nested.id);
        }
      } catch (e) {
        // If response has no JSON body or unexpected shape, ignore and proceed
      }
      // Successfully created cart request, move to payment/QR step
      setShowPayment(true);
      toast.success("Challan settlement request created. Please complete the payment and enter the transaction ID.");
      if (typeof onCartSubmitted === 'function') {
        onCartSubmitted();
      }
    } catch (err) {
      console.error("Failed to submit cart request", err);
      toast.error("Failed to submit challan settlement request. Please try again.");
    } finally {
      setIsSubmittingCart(false);
    }
  };

  const submitTransaction = async () => {
    if (!transactionId.trim()) {
      setTransactionError("Please enter the UPI transaction / reference ID.");
      return;
    }

    setTransactionError("");

    const API_ROOT = import.meta.env.VITE_API_BASE_URL;
    if (!API_ROOT) {
      toast.error("API base URL is not configured. Please contact support.");
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

    if (!requestId) {
      toast.error("Unable to find challan settlement request ID. Please contact support.");
      return;
    }

    const payload = {
      client_id: clientId,
      admin_id: adminId,
      dealer_id: dealerId,
      request_id: requestId,
      transaction_id: transactionId.trim(),
    };

    try {
      setIsSubmittingTxn(true);
      const res = await fetch(`${API_ROOT}/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      toast.success("Thank you. We have recorded your transaction ID and will verify the payment shortly.");
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("Failed to submit transaction ID", err);
      toast.error("Failed to submit transaction ID. Please try again.");
    } finally {
      setIsSubmittingTxn(false);
    }
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
            ? `Congrats, we have received your challan settlement request #${requestId}.`
            : `Challan Cart (${cart.length})`}
        </h2>
        <div style={{ lineHeight: 1.7, fontSize: 15 }}>
          {!showPayment && cart.length === 0 ? (
            <div>No challans in cart.</div>
          ) : (
            <>
              {!showPayment && (
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
                  <button
                    className="action-btn"
                    type="button"
                    style={{ marginTop: 16, width: '100%' }}
                    onClick={submitCartRequest}
                    disabled={isSubmittingCart}
                  >
                    {isSubmittingCart ? "Submitting..." : "Submit Request"}
                  </button>
                </>
              )}
              {showPayment && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 18,
                    borderRadius: 12,
                    border: '1px solid #d0e2ff',
                    background: 'linear-gradient(135deg, #f5f9ff 0%, #eef5ff 100%)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
                    <div
                      style={{
                        flex: '0 0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 12,
                        background: '#fff',
                        borderRadius: 10,
                        border: '1px solid #d0d7e2',
                        boxShadow: '0 4px 12px rgba(15, 76, 129, 0.12)',
                      }}
                    >
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=upi://pay?pa=demo@upi&pn=Smart%20Challan&am=1.00&cu=INR"
                        alt="Sample UPI QR code"
                        width={190}
                        height={190}
                        style={{ display: 'block' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 8,
                        }}>
                          <i className="ri-shield-check-line" style={{ fontSize: 16 }} />
                          Secure UPI payment
                        </div>
                        <p style={{ marginTop: 0, marginBottom: 4, fontSize: 14 }}>
                          Scan the QR in any UPI app to make payment for your selected challans.
                        </p>
                        <p style={{ fontSize: 12, color: '#57606a', marginTop: 0, marginBottom: 12 }}>
                          After payment, enter your UPI transaction / reference ID below so our team can verify and mark the challans as paid.
                        </p>
                        <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                          Transaction / UPI Reference ID
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTransactionId(val);
                            if (transactionError && val.trim()) {
                              setTransactionError("");
                            }
                          }}
                          placeholder="Enter transaction ID from your UPI app"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: transactionError ? '1px solid #e53935' : '1px solid #c5d0e6',
                            fontSize: 14,
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />
                        {transactionError && (
                          <div style={{ marginTop: 4, fontSize: 12, color: '#e53935' }}>
                            {transactionError}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          className="action-btn flat-btn"
                          type="button"
                          onClick={onClose}
                          style={{
                            padding: '6px 16px',
                            fontSize: 13,
                            opacity: isSubmittingTxn ? 0.7 : 1,
                            cursor: isSubmittingTxn ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isSubmittingTxn}
                        >
                          Close
                        </button>
                        <button
                          className="action-btn"
                          type="button"
                          onClick={submitTransaction}
                          style={{
                            padding: '6px 18px',
                            fontSize: 13,
                            opacity: isSubmittingTxn ? 0.8 : 1,
                            cursor: isSubmittingTxn ? 'wait' : 'pointer',
                          }}
                          disabled={isSubmittingTxn}
                        >
                          {isSubmittingTxn ? 'Submitting...' : 'Submit transaction'}
                        </button>
                      </div>
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
