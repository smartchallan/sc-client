import React, { useState } from "react";

// Dummy columns for demonstration. Adjust as per your actual data shape.
const columns = [
  { key: "vehicle_number", label: "Vehicle Number" },
  { key: "owner_name", label: "Owner Name" },
  { key: "rto_expiry", label: "RTO Expiry" },
  { key: "status", label: "Status" },
];

// Dummy data for demonstration. Replace with real data via props or API.
const demoData = Array.from({ length: 56 }, (_, i) => ({
  vehicle_number: `MH12AB${String(1000 + i)}`,
  owner_name: `Owner ${i + 1}`,
  rto_expiry: `202${i % 10}-12-31`,
  status: i % 2 === 0 ? "Active" : "Expired",
}));

export default function VehicleDataTable({ data = demoData }) {
  const [visibleCount, setVisibleCount] = useState(20);
  const total = data.length;
  const showing = Math.min(visibleCount, total);

  return (
    <div className="dashboard-latest modern-form-card" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Vehicle RTO Data</h2>
      {total > 0 && (
        <div style={{
          marginBottom: 8,
          color: "#222",
          fontSize: 15,
          background: "#e3f7d6",
          border: "1.5px solid #4caf50",
          borderRadius: 6,
          padding: "4px 12px",
          fontWeight: 600,
          display: "inline-block",
        }}>
          Showing {showing} of {total} records
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table className="vehicle-challan-table" style={{ width: "100%", minWidth: 700, marginTop: 8 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, visibleCount).map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showing < total && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button className="action-btn flat-btn" onClick={() => setVisibleCount(v => v + 20)}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
