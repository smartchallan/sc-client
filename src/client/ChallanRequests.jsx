import React, { useEffect, useState } from "react";
import RightSidebar from "./RightSidebar";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export default function ChallanRequests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    async function fetchRequests() {
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
        } catch {
          clientId = null;
        }

        if (!clientId) {
          setRequests([]);
          setError("Client information not found. Please log in again.");
          return;
        }

        const url = `${API_ROOT}/cart?client_id=${clientId}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json && json.message ? json.message : "Failed to load challan requests");
        }

        const rows = Array.isArray(json?.data) ? json.data : [];
        setRequests(rows);
        setError(null);
      } catch (e) {
        setRequests([]);
        setError(e.message || "Something went wrong while loading challan requests.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, []);

  return (
    <div className="my-challans-content">
      <p className="page-subtitle">View and track your challan settlement requests</p>

      <div className="vst-card" style={{ marginTop: 18 }}>
        <div className="vst-header">
          <div className="vst-header__left">
            <span className="vst-header__icon-box" style={{ background: 'linear-gradient(135deg,#2196f3,#21cbf3)' }}>
              <i className="ri-file-list-3-line"></i>
            </span>
            <h2 className="vst-header__title">Challan Requests</h2>
          </div>
          {Array.isArray(requests) && requests.length > 0 && !isLoading && (
            <span className="vst-record-badge">Total requests: {requests.length}</span>
          )}
        </div>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 999,
                background: "#e3f2fd",
                border: "1px solid #bbdefb",
                color: "#1565c0",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid #90caf9",
                  borderTopColor: "#1565c0",
                  animation: "sc-spin 0.8s linear infinite",
                }}
              />
              <span>Loading challan requests - please wait...</span>
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: 24, color: "#c62828", fontSize: 14 }}>
            {error}
          </div>
        ) : (
          Array.isArray(requests) && requests.length === 0 ? (
            <div
              style={{
                padding: 28,
                textAlign: "center",
                color: "#455a64",
                fontSize: 14,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "18px 22px 16px 22px",
                  borderRadius: 16,
                  border: "1.5px dashed #b0bec5",
                  background: "linear-gradient(145deg, #f7f9fc 0%, #e3f2fd 55%, #f1f8ff 100%)",
                  maxWidth: 520,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div className="challan-empty-emoji" aria-hidden="true">
                  🚗💨
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 4,
                    fontSize: 15,
                    color: "#1565c0",
                  }}
                >
                  No challan requests yet
                </div>
                <div style={{ marginBottom: 6 }}>
                  You haven&apos;t raised any challan settlement request.
                </div>
                <div>
                  Why worry? <span style={{ fontSize: 32 }}>🙂</span> Go ahead and{" "}
                  <a
                    href="#pay-challans"
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("client-go-pay-challans"));
                        }
                      } catch (_) {}
                    }}
                    className="challan-pay-link-blink"
                    style={{
                      color: "#1565c0",
                      fontWeight: 600,
                      fontSize: 20,
                      textDecoration: "underline",
                    }}
                  >
                    pay your challans
                  </a>{""}
                  .
                </div>
              </div>
            </div>
          ) : (
            <div className="vst-table-wrap">
              <table className="vst-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Request ID</th>
                    <th>Created At</th>
                    <th>Status</th>
                    <th>Challan Count</th>
                    <th>Transaction ID</th>
                    <th>Last Updated By</th>
                    <th>View</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                {Array.isArray(requests) &&
                  requests.map((req, idx) => (
                    <tr key={req.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{req.id ?? "-"}</td>
                      <td>{formatDateTime(req.created_at)}</td>
                      <td>
                        <span className={`vst-status-pill ${req.status === 'pending' ? 'vst-status-pill--pending' : (req.status === 'completed' || req.status === 'success') ? 'vst-status-pill--disposed' : 'vst-status-pill--default'}`}>
                          {req.status || "-"}
                        </span>
                      </td>
                      <td>{req.item_count ?? (Array.isArray(req.line_items) ? req.line_items.length : "-")}</td>
                      <td>{req.transaction_id || "-"}</td>
                      <td>{req.last_updated_by || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="vst-view-btn"
                          title="View challan request details"
                          onClick={() => {
                            setSelectedRequest(req);
                            setSidebarOpen(true);
                          }}
                        >
                          <i className="ri-eye-line" />
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="vst-view-btn"
                          title="Open challan request actions"
                        >
                          <i className="ri-more-2-fill" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      {sidebarOpen && selectedRequest && (
        <RightSidebar
          open={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setTimeout(() => setSelectedRequest(null), 300);
          }}
          title={selectedRequest ? `Challan Request #${selectedRequest.id}` : "Challan Request"}
        >
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e3eaf1",
              padding: "12px 14px 10px 14px",
              background: "linear-gradient(135deg, #e3f2fd 0%, #f5f8fa 100%)",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <div
                style={{
                  width: 4,
                  height: 18,
                  borderRadius: 3,
                  background: "#1976d2",
                  marginRight: 8,
                }}
              />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0d47a1", letterSpacing: "0.03em" }}>
              REQUEST DETAILS
            </span>
            </div>
            <table className="latest-table" style={{ width: "100%", fontSize: 13 }}>
              <tbody>
                <tr>
                  <td><b>Status</b></td>
                  <td>{selectedRequest.status || "-"}</td>
                </tr>
                <tr>
                  <td><b>Created At</b></td>
                  <td>{formatDateTime(selectedRequest.created_at)}</td>
                </tr>
                <tr>
                  <td><b>Transaction ID</b></td>
                  <td>{selectedRequest.transaction_id || "-"}</td>
                </tr>
                <tr>
                  <td><b>Last Updated By</b></td>
                  <td>{selectedRequest.last_updated_by || "-"}</td>
                </tr>
                <tr>
                  <td><b>Challan Count</b></td>
                  <td>{selectedRequest.item_count ?? (Array.isArray(selectedRequest.line_items) ? selectedRequest.line_items.length : "-")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e3eaf1",
              padding: "12px 12px 4px 12px",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 3,
                    background: "#ef6c00",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e65100", letterSpacing: "0.03em" }}>
                  REQUESTED CHALLANS
                </span>
              </div>
              {Array.isArray(selectedRequest.line_items) && selectedRequest.line_items.length > 0 && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fff3e0", color: "#e65100", fontWeight: 600 }}>
                  {selectedRequest.line_items.length} items
                </span>
              )}
            </div>

          <div className="table-container">
            <table className="latest-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vehicle No.</th>
                  <th>Challan No</th>
                  <th>Type</th>
                  <th>Challan Amount</th>
                  <th>Service Fee</th>
                  <th>GST %</th>
                  <th>GST Amt</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(selectedRequest.line_items) || selectedRequest.line_items.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No line items found for this request.</td>
                  </tr>
                ) : (
                  selectedRequest.line_items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{index + 1}</td>
                      <td>{item.vehicle_number || "-"}</td>
                      <td>{item.challan_number || "-"}</td>
                      <td>{item.challan_type || "-"}</td>
                      <td>{item.challan_amount != null ? `₹${Number(item.challan_amount).toLocaleString("en-IN")}` : "-"}</td>
                      <td>{item.service_fee != null ? `₹${Number(item.service_fee).toLocaleString("en-IN")}` : "-"}</td>
                      <td>{item.gst_percent != null ? `${item.gst_percent}%` : "-"}</td>
                      <td>{item.gst_amt != null ? `₹${Number(item.gst_amt).toLocaleString("en-IN")}` : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        </RightSidebar>
      )}
      </div>
    </div>
  );
}

