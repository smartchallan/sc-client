import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export default function ChallanCartModal({ open, cart, onClose, onRemove, onSubmittingChange, onCartSubmitted }) {
  // Pricing + UPI come from server (resolved client-override > dealer default)
  const [pricingInfo, setPricingInfo] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState("");

  const ONLINE_FEE = Number(pricingInfo?.pricing?.online_fee?.value ?? 0);
  const VIRTUAL_COURT_FEE = Number(pricingInfo?.pricing?.virtual_court_fee?.value ?? 0);
  const REGISTERED_COURT_FEE = Number(pricingInfo?.pricing?.court_fee?.value ?? 0);
  const GST_PERCENT = Number(pricingInfo?.pricing?.gst_percent?.value ?? 0);

  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [isSubmittingTxn, setIsSubmittingTxn] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  // Add spin animation for loaders
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  // Load resolved pricing + UPI for the logged-in client when modal opens
  useEffect(() => {
    if (!open) return;
    const API_ROOT = import.meta.env.VITE_API_BASE_URL;
    if (!API_ROOT) {
      setPricingError("API base URL is not configured.");
      return;
    }
    let clientId = null;
    try {
      const stored = JSON.parse(localStorage.getItem("sc_user")) || {};
      if (stored && stored.user) {
        clientId = stored.user.client_id || stored.user.id || stored.user._id || null;
      }
    } catch { /* ignore */ }

    if (!clientId) {
      setPricingError("Unable to identify the logged-in client.");
      return;
    }

    setPricingLoading(true);
    setPricingError("");
    fetch(`${API_ROOT}/usermeta/pricing?client_id=${clientId}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.client_id) setPricingInfo(d);
        else setPricingError(d.error || "Failed to load pricing");
      })
      .catch(() => setPricingError("Failed to load pricing"))
      .finally(() => setPricingLoading(false));
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
    let parentId = null;
    try {
      const stored = JSON.parse(localStorage.getItem("sc_user")) || {};
      if (stored && stored.user) {
        const u = stored.user;
        clientId = u.client_id || u.id || u._id || null;
        parentId = u.parent_id || null;
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
      parent_id: parentId,
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
    let parentId = null;
    try {
      const stored = JSON.parse(localStorage.getItem("sc_user")) || {};
      if (stored && stored.user) {
        const u = stored.user;
        clientId = u.client_id || u.id || u._id || null;
        parentId = u.parent_id || null;
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
      parent_id: parentId,
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

  const paymentAvailable = !!(pricingInfo && pricingInfo.paymentAvailable);
  const pricingComplete = !!(pricingInfo && pricingInfo.pricingComplete);
  const upiId = pricingInfo?.upi?.upi_id || "";
  const payeeName = pricingInfo?.upi?.payee_name || "Smart Challan";

  // Build UPI deep-link + QR image URL with the actual amount
  const upiQrUrl = useMemo(() => {
    if (!upiId) return null;
    const amount = Number(cartTotals.total || 0).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Challan settlement #' + (requestId || ''))}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;
  }, [upiId, payeeName, cartTotals.total, requestId]);

    if (!open) {
      return null;
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          position: 'relative',
          maxWidth: showPayment ? 1000 : 960,
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          padding: '16px 20px 16px',
        }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 18,
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              fontSize: 22,
              lineHeight: '36px',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#475569',
              fontWeight: 700,
              zIndex: 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            ×
          </button>
          <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: '1.5px solid #e2e8f0'
        }}>
          {showPayment ? (
            <>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="ri-checkbox-circle-fill" style={{ fontSize: 20, color: '#fff' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                  Request Submitted Successfully!
                </h2>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  Request ID: <span style={{ fontWeight: 600, color: '#0891b2' }}>#{requestId}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="ri-shopping-cart-2-fill" style={{ fontSize: 18, color: '#fff' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                  Review Your Cart
                </h2>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  {cart.length} {cart.length === 1 ? 'challan' : 'challans'} ready for settlement
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ fontSize: 14 }}>
          {!showPayment && cart.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
              <i className="ri-shopping-cart-line" style={{ fontSize: 48, display: 'block', marginBottom: 10, color: '#cbd5e1' }}></i>
              No challans in cart.
            </div>
          ) : (
            <>
              {!showPayment && (
                <>
                  {pricingLoading && (
                    <div style={{ marginBottom: 8, padding: '7px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, color: '#1d4ed8', fontSize: 12 }}>
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />
                      Loading pricing…
                    </div>
                  )}
                  {!pricingLoading && pricingInfo && !paymentAvailable && (
                    <div style={{ marginBottom: 8, padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, color: '#b91c1c', fontSize: 12, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <i className="ri-error-warning-line" style={{ fontSize: 15, marginTop: 1 }} />
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 1 }}>Challan payment service is unavailable</div>
                        <div>Your dealer has not configured a UPI account. Please contact your dealer.</div>
                      </div>
                    </div>
                  )}
                  {!pricingLoading && pricingInfo && paymentAvailable && !pricingComplete && (
                    <div style={{ marginBottom: 8, padding: '7px 10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 7, color: '#9a3412', fontSize: 12 }}>
                      <i className="ri-alarm-warning-line" style={{ marginRight: 5 }} />
                      Pricing not fully configured (online fee or GST missing). Please contact your dealer.
                    </div>
                  )}
                  {pricingError && (
                    <div style={{ marginBottom: 8, padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, color: '#b91c1c', fontSize: 12 }}>
                      {pricingError}
                    </div>
                  )}

                  {/* Two-column layout: challan cards | summary + submit */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

                    {/* Left: scrollable challan cards */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 8,
                        maxHeight: 'calc(92vh - 220px)',
                        overflowY: 'auto',
                        paddingRight: 2,
                      }}>
                        {cart.map((c) => {
                          const base = parseAmount(c.fine_imposed);
                          const fee = getServiceFee(c);
                          const gst = (fee * GST_PERCENT) / 100;
                          const lineTotal = base + fee + gst;
                          const type = getChallanType(c);
                          const label = type === "virtual" ? "Virtual" : type === "registered" ? "Court" : "Online";
                          const typeColor = type === "virtual" ? "#9333ea" : type === "registered" ? "#dc2626" : "#0891b2";
                          const typeBg = type === "virtual" ? "#faf5ff" : type === "registered" ? "#fef2f2" : "#ecfeff";

                          return (
                            <div
                              key={c.challan_no}
                              style={{
                                background: '#fff',
                                borderRadius: 8,
                                padding: '10px 10px 8px',
                                border: '1px solid #e2e8f0',
                                position: 'relative',
                              }}
                            >
                              <button
                                type="button"
                                title="Remove"
                                style={{
                                  position: 'absolute', top: 7, right: 7,
                                  background: '#fee', color: '#dc2626', border: 'none',
                                  borderRadius: 6, padding: '3px 6px', fontSize: 13, cursor: 'pointer',
                                }}
                                onClick={() => onRemove && onRemove(c)}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fee'; e.currentTarget.style.color = '#dc2626'; }}
                              >
                                <i className="ri-delete-bin-line" />
                              </button>

                              {/* Type badge + challan no on same row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, paddingRight: 28 }}>
                                <span style={{
                                  background: typeBg, color: typeColor,
                                  padding: '2px 7px', borderRadius: 4, fontSize: 10,
                                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0,
                                }}>{label}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>
                                  {c.challan_no}
                                </span>
                              </div>

                              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="ri-car-line" style={{ fontSize: 13 }}></i>
                                {c.vehicle_number}
                              </div>

                              <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 8px', fontSize: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, color: '#475569' }}>
                                  <span>Challan</span>
                                  <span style={{ fontWeight: 600 }}>₹{base.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, color: '#475569' }}>
                                  <span>Service</span>
                                  <span style={{ fontWeight: 600 }}>₹{fee.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#475569' }}>
                                  <span>GST</span>
                                  <span style={{ fontWeight: 600 }}>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 5, borderTop: '1px dashed #cbd5e1', color: '#0f172a', fontWeight: 700 }}>
                                  <span>Total</span>
                                  <span style={{ color: '#0891b2' }}>₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: summary + submit (sticky) */}
                    <div style={{ width: 240, flexShrink: 0 }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        border: '1.5px solid #e2e8f0',
                        marginBottom: 10,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
                          Payment Summary
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#475569' }}>
                          <span>Challans ({cart.length})</span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartTotals.base.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, color: '#475569' }}>
                          <span>Service Fee</span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartTotals.fee.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#475569' }}>
                          <span>GST @ {GST_PERCENT}%</span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cartTotals.gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          paddingTop: 8, borderTop: '1.5px dashed #cbd5e1', fontSize: 15,
                        }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>Grand Total</span>
                          <span style={{ fontWeight: 700, color: '#0891b2' }}>
                            ₹{cartTotals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <button
                        className="action-btn"
                        type="button"
                        style={{
                          width: '100%',
                          background: (!paymentAvailable || !pricingComplete) ? '#cbd5e1' : 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                          color: '#fff',
                          padding: '10px 14px',
                          fontSize: 14,
                          fontWeight: 700,
                          borderRadius: 9,
                          border: 'none',
                          cursor: isSubmittingCart ? 'wait' : ((!paymentAvailable || !pricingComplete) ? 'not-allowed' : 'pointer'),
                          boxShadow: (!paymentAvailable || !pricingComplete) ? 'none' : '0 4px 12px rgba(8, 145, 178, 0.25)',
                          transition: 'all 0.2s',
                          opacity: isSubmittingCart ? 0.8 : 1,
                        }}
                        onClick={submitCartRequest}
                        disabled={isSubmittingCart || !paymentAvailable || !pricingComplete}
                        title={!paymentAvailable ? 'Payment service unavailable' : (!pricingComplete ? 'Pricing not configured' : '')}
                      >
                        {isSubmittingCart ? (
                          <>
                            <i className="ri-loader-4-line" style={{ marginRight: 6, animation: 'spin 1s linear infinite' }}></i>
                            Submitting…
                          </>
                        ) : (
                          <>
                            <i className="ri-checkbox-circle-line" style={{ marginRight: 6 }}></i>
                            Submit Request
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </>
              )}
              {showPayment && (
                <div style={{ marginTop: 8 }}>
                  {/* Payment Amount Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 16,
                    padding: '24px 28px',
                    marginBottom: 24,
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
                    color: '#fff',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 15, opacity: 0.95, marginBottom: 8, fontWeight: 500 }}>
                      Total Payment Amount
                    </div>
                    <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-1px', marginBottom: 8 }}>
                      ₹{cartTotals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <i className="ri-information-line"></i>
                      Request ID: #{requestId}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>
                    {/* QR Code Section */}
                    <div style={{
                      background: '#fff',
                      borderRadius: 16,
                      padding: 28,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}>
                        <i className="ri-qr-scan-2-line" style={{ fontSize: 22, color: '#667eea' }}></i>
                        Scan QR to Pay
                      </div>

                      <div style={{
                        background: 'linear-gradient(145deg, #f8fafc 0%, #fff 100%)',
                        padding: 20,
                        borderRadius: 16,
                        border: '3px solid #e2e8f0',
                        marginBottom: 20,
                        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}>
                        {upiQrUrl ? (
                          <img
                            src={upiQrUrl}
                            alt="UPI Payment QR Code"
                            width={240}
                            height={240}
                            style={{ display: 'block', margin: '0 auto', borderRadius: 8 }}
                          />
                        ) : (
                          <div style={{
                            width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto', borderRadius: 8, background: '#fef2f2', color: '#dc2626',
                            border: '1px dashed #fecaca', fontSize: 13, textAlign: 'center', padding: 12,
                          }}>
                            UPI not configured by your dealer
                          </div>
                        )}
                        {upiId && (
                          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                            Paying to <b>{payeeName}</b> · <span style={{ fontFamily: 'monospace' }}>{upiId}</span>
                          </div>
                        )}
                      </div>

                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 16
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, color: '#166534', fontWeight: 600 }}>
                          <i className="ri-shield-check-fill" style={{ fontSize: 18, color: '#10b981' }}></i>
                          100% Secure Payment
                        </div>
                      </div>

                      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                        Scan with any UPI app
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: 12, 
                        justifyContent: 'center', 
                        marginTop: 12,
                        flexWrap: 'wrap'
                      }}>
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <div key={app} style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#475569'
                          }}>
                            {app}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions & Input Section */}
                    <div>
                      {/* Steps Card */}
                      <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                        marginBottom: 20
                      }}>
                        <div style={{ 
                          fontSize: 17,
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: 18,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}>
                            <i className="ri-guide-line" style={{ fontSize: 18 }}></i>
                          </div>
                          Payment Instructions
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {[
                            { icon: 'ri-smartphone-line', text: 'Open any UPI app on your phone' },
                            { icon: 'ri-qr-scan-line', text: 'Scan the QR code displayed on the left' },
                            { icon: 'ri-check-double-line', text: `Verify amount: ₹${cartTotals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
                            { icon: 'ri-secure-payment-line', text: 'Complete the payment securely' },
                            { icon: 'ri-file-list-3-line', text: 'Copy the transaction ID from your UPI app' },
                            { icon: 'ri-input-method-line', text: 'Enter the transaction ID below and submit' }
                          ].map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                              <div style={{
                                minWidth: 32,
                                height: 32,
                                borderRadius: 8,
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0891b2',
                                fontSize: 14,
                                fontWeight: 700
                              }}>
                                {idx + 1}
                              </div>
                              <div style={{
                                flex: 1,
                                paddingTop: 6
                              }}>
                                <div style={{ fontSize: 15, color: '#1e293b', lineHeight: 1.6, fontWeight: idx === 2 ? 600 : 400 }}>
                                  {step.text}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transaction ID Input Card */}
                      <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        border: transactionError ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        boxShadow: transactionError ? '0 4px 20px rgba(239, 68, 68, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.06)',
                        marginBottom: 20
                      }}>
                        <label style={{ 
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 12
                        }}>
                          <i className="ri-key-2-line" style={{ fontSize: 20, color: '#667eea' }}></i>
                          Enter Transaction ID
                          <span style={{ color: '#ef4444', fontSize: 18 }}>*</span>
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
                          placeholder="Enter UPI transaction or reference ID"
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: 10,
                            border: transactionError ? '2px solid #ef4444' : '2px solid #e2e8f0',
                            fontSize: 16,
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'all 0.2s',
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                            background: '#fafbfc'
                          }}
                          onFocus={(e) => {
                            if (!transactionError) {
                              e.target.style.borderColor = '#667eea';
                              e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                              e.target.style.background = '#fff';
                            }
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = transactionError ? '#ef4444' : '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                            e.target.style.background = '#fafbfc';
                          }}
                        />
                        {transactionError && (
                          <div style={{ 
                            marginTop: 10,
                            fontSize: 14,
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: 10,
                            background: '#fef2f2',
                            borderRadius: 8,
                            border: '1px solid #fecaca'
                          }}>
                            <i className="ri-error-warning-fill"></i>
                            {transactionError}
                          </div>
                        )}
                        <div style={{ 
                          marginTop: 10,
                          fontSize: 14,
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'start',
                          gap: 8,
                          padding: 10,
                          background: '#f8fafc',
                          borderRadius: 8
                        }}>
                          <i className="ri-lightbulb-line" style={{ marginTop: 2, color: '#0891b2' }}></i>
                          <span>Find the transaction ID in your UPI app's payment history or SMS confirmation</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          className="action-btn flat-btn"
                          type="button"
                          onClick={onClose}
                          style={{
                            flex: 1,
                            padding: '14px 24px',
                            fontSize: 16,
                            fontWeight: 600,
                            background: '#fff',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: 12,
                            cursor: isSubmittingTxn ? 'not-allowed' : 'pointer',
                            opacity: isSubmittingTxn ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          disabled={isSubmittingTxn}
                          onMouseEnter={(e) => {
                            if (!isSubmittingTxn) {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          <i className="ri-close-line" style={{ marginRight: 8 }}></i>
                          Cancel
                        </button>
                        <button
                          className="action-btn"
                          type="button"
                          onClick={submitTransaction}
                          style={{
                            flex: 2,
                            padding: '14px 28px',
                            fontSize: 16,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            cursor: isSubmittingTxn ? 'wait' : 'pointer',
                            opacity: isSubmittingTxn ? 0.8 : 1,
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s'
                          }}
                          disabled={isSubmittingTxn}
                          onMouseEnter={(e) => {
                            if (!isSubmittingTxn) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
                          }}
                        >
                          {isSubmittingTxn ? (
                            <>
                              <i className="ri-loader-4-line" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}></i>
                              Verifying Payment...
                            </>
                          ) : (
                            <>
                              <i className="ri-check-double-line" style={{ marginRight: 8 }}></i>
                              Confirm Payment
                            </>
                          )}
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
