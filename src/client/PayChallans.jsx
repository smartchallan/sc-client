import React, { useEffect, useState } from "react";
import { ChallanTableV2, handleChallanPrint, handleChallanDownloadExcel } from "./MyChallans";
import RightSidebar from "./RightSidebar";
import ChallanCartModal from "./ChallanCartModal";

export default function PayChallans() {
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
      try {
        const API_ROOT = import.meta.env.VITE_API_BASE_URL;
        if (!API_ROOT) {
          throw new Error("VITE_API_BASE_URL is not set. Please check your .env file and restart the dev server.");
        }
        let clientId = null;
        try {
          const stored = JSON.parse(localStorage.getItem("sc_user")) || {};
          if (stored && stored.user) {
            clientId = stored.user.id || stored.user._id || stored.user.client_id || null;
          }
        } catch (e) {
          clientId = null;
        }
        if (!clientId) {
          setPendingChallans([]);
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
  }, []);

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
      <p className="page-subtitle">Select vehicle challans for challan settlement and add them to your cart.</p>

      {isLoading ? (
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
            onClickDownload={() => handleChallanDownloadExcel(pendingChallans)}
            onClickPrint={handleChallanPrint}
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
          title={`Challan Cart (${cart.length})`}
        >
          {cart.length === 0 ? (
            <div style={{ padding: 16, color: "#666" }}>No challans in cart.</div>
          ) : (
            <>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {cart.map((c) => (
                  <li key={c.challan_no} style={{ marginBottom: 10 }}>
                    <div>
                      <b>{c.challan_no}</b> ({c.vehicle_number})
                    </div>
                    {(() => {
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
                        <div style={{ fontSize: 13, color: "#444", marginTop: 2 }}>
                          <span style={{ marginRight: 8 }}>Type: {label}</span>
                          <span style={{ marginRight: 8 }}>| Challan: ₹{base.toLocaleString("en-IN")}</span>
                          <span style={{ marginRight: 8 }}>| Service fee: ₹{fee.toLocaleString("en-IN")}</span>
                          <span style={{ marginRight: 8 }}>
                            | GST @ {GST_PERCENT}%: ₹{gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </span>
                          <span style={{ fontWeight: 600 }}>| Total: ₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                        </div>
                      );
                    })()}
                    <button
                      className="action-btn flat-btn"
                      style={{ marginTop: 4, background: "#eee", color: "#e53935", fontSize: 16, padding: "2px 6px" }}
                      type="button"
                      title="Remove from cart"
                      onClick={() => removeFromCart(c)}
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px solid #e3eaf1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>Total challans</span>
                  <span>{cart.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Total challan amount</span>
                  <span>₹{cartTotals.base.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Total service fee</span>
                  <span>₹{cartTotals.fee.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 600 }}>Total GST @ {GST_PERCENT}%</span>
                  <span>₹{cartTotals.gst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700 }}>Grand total</span>
                  <span style={{ fontWeight: 700 }}>₹{cartTotals.total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="action-btn flat-btn"
                    type="button"
                    style={{ flex: 1, background: "#f5f5f5", color: "#555" }}
                    onClick={() => !isSubmittingCart && setCart([])}
                    disabled={isSubmittingCart}
                  >
                    Clear Cart
                  </button>
                  <button
                    className="action-btn"
                    type="button"
                    style={{ flex: 1, opacity: isSubmittingCart ? 0.8 : 1, cursor: isSubmittingCart ? "wait" : "pointer" }}
                    onClick={() => {
                      if (!isSubmittingCart) setCartModalOpen(true);
                    }}
                    disabled={isSubmittingCart}
                  >
                    {isSubmittingCart ? "Processing..." : "Proceed to Settlement"}
                  </button>
                </div>
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
