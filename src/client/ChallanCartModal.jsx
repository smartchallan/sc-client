import React, { useEffect, useState } from "react";
import tsplQr from '../assets/tspl-qr.png';
// Robust QR image logic for Vite/React
let qrImageUrl = import.meta.env.VITE_CHALLAN_QR_IMAGE_URL;
if (qrImageUrl && !/^https?:\/\//.test(qrImageUrl)) {
  qrImageUrl = tsplQr;
}
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

    if (!open) {
      return null;
    }

    return (
      <div className="custom-modal-overlay">
        <div className="custom-modal" style={{ maxWidth: showPayment ? 1100 : 1400, width: '95%' }}>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <div className="custom-modal-content">
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '2px solid #e2e8f0'
        }}>
          {showPayment ? (
            <>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <i className="ri-checkbox-circle-fill" style={{ fontSize: 28, color: '#fff' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                  Request Submitted Successfully!
                </h2>
                <div style={{ fontSize: 16, color: '#64748b', marginTop: 4 }}>
                  Request ID: <span style={{ fontWeight: 600, color: '#0891b2' }}>#{requestId}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <i className="ri-shopping-cart-2-fill" style={{ fontSize: 24, color: '#fff' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1e293b' }}>
                  Review Your Cart
                </h2>
                <div style={{ fontSize: 16, color: '#64748b', marginTop: 4 }}>
                  {cart.length} {cart.length === 1 ? 'challan' : 'challans'} ready for settlement
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ lineHeight: 1.7, fontSize: 17 }}>
          {!showPayment && cart.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <i className="ri-shopping-cart-line" style={{ fontSize: 64, display: 'block', marginBottom: 16, color: '#cbd5e1' }}></i>
              No challans in cart.
            </div>
          ) : (
            <>
              {!showPayment && (
                <>
                  <div style={{ 
                    marginTop: 8,
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: 16
                  }}>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: 14
                    }}>
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
                              borderRadius: 10,
                              padding: 16,
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            <button
                              className="action-btn flat-btn"
                              style={{ 
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                background: '#fee',
                                color: '#dc2626',
                                fontSize: 16,
                                padding: '6px 8px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                zIndex: 1
                              }}
                              type="button"
                              title="Remove from cart"
                              onClick={() => onRemove && onRemove(c)}
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

                            <div style={{ 
                              display: 'inline-block',
                              background: typeBg,
                              color: typeColor,
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: 10
                            }}>
                              {label}
                            </div>

                            <div style={{ 
                              fontSize: 17,
                              fontWeight: 700,
                              color: '#1e293b',
                              marginBottom: 6,
                              paddingRight: 35,
                              wordBreak: 'break-all'
                            }}>
                              {c.challan_no}
                            </div>

                            <div style={{ 
                              fontSize: 15,
                              color: '#64748b',
                              marginBottom: 14,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <i className="ri-car-line" style={{ fontSize: 17 }}></i>
                              {c.vehicle_number}
                            </div>

                            <div style={{ 
                              background: '#f8fafc',
                              borderRadius: 8,
                              padding: 12,
                              fontSize: 15
                            }}>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                                color: '#475569'
                              }}>
                                <span>Challan</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{base.toLocaleString('en-IN')}</span>
                              </div>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                                color: '#475569'
                              }}>
                                <span>Service</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{fee.toLocaleString('en-IN')}</span>
                              </div>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                                color: '#475569'
                              }}>
                                <span>GST</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                              </div>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: 10,
                                borderTop: '2px dashed #cbd5e1',
                                color: '#0f172a',
                                fontSize: 16
                              }}>
                                <span style={{ fontWeight: 700 }}>Total</span>
                                <span style={{ fontWeight: 700, color: '#0891b2' }}>
                                  ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginTop: 20,
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: 12,
                    padding: 20,
                    border: '2px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: 14
                    }}>
                      Payment Summary
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 16, color: '#475569' }}>
                      <span>Total Challans ({cart.length})</span>
                      <span style={{ fontWeight: 600 }}>₹{cartTotals.base.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 16, color: '#475569' }}>
                      <span>Service Fee</span>
                      <span style={{ fontWeight: 600 }}>₹{cartTotals.fee.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 16, color: '#475569' }}>
                      <span>GST @ {GST_PERCENT}%</span>
                      <span style={{ fontWeight: 600 }}>₹{cartTotals.gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 14,
                      borderTop: '2px dashed #cbd5e1',
                      fontSize: 20
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
                      marginTop: 20,
                      width: '100%',
                      background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                      color: '#fff',
                      padding: '14px 24px',
                      fontSize: 17,
                      fontWeight: 700,
                      borderRadius: 10,
                      border: 'none',
                      cursor: isSubmittingCart ? 'wait' : 'pointer',
                      boxShadow: '0 4px 14px rgba(8, 145, 178, 0.3)',
                      transition: 'all 0.2s',
                      opacity: isSubmittingCart ? 0.8 : 1
                    }}
                    onClick={submitCartRequest}
                    disabled={isSubmittingCart}
                    onMouseEnter={(e) => {
                      if (!isSubmittingCart) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(8, 145, 178, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(8, 145, 178, 0.3)';
                    }}
                  >
                    {isSubmittingCart ? (
                      <>
                        <i className="ri-loader-4-line" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}></i>
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <i className="ri-checkbox-circle-line" style={{ marginRight: 8 }}></i>
                        Submit Settlement Request
                      </>
                    )}
                  </button>
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
                        <img
                          src={qrImageUrl}
                          alt="UPI Payment QR Code"
                          width={240}
                          height={240}
                          style={{ display: 'block', margin: '0 auto', borderRadius: 8 }}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi://pay?pa=demo@upi&pn=Smart%20Challan&am=1.00&cu=INR'; }}
                        />
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
