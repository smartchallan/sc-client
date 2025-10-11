import React, { useState } from "react";
import "../RegisterVehicle.css";

const sampleFastagTransactions = [
  {
    readerReadTime: "2021-10-30 12:26:09.0",
    seqNo: "68d47e2d-c10f-4f57-b12a-2dfb547ce5c8",
    laneDirection: "N",
    tollPlazaGeocode: "11.0001,11.0001",
    tollPlazaName: "GMR Chillakallu Toll Plaza",
    vehicleType: "VC7",
    vehicleRegNo: "MH19JK3923"
  },
  {
    readerReadTime: "2021-10-30 12:41:23.0",
    seqNo: "6361cf5f-8ddd-46dd-9593-0aa0e1fd5780",
    laneDirection: "N",
    tollPlazaGeocode: "11.0001,11.0001",
    tollPlazaName: "GMR Chillakallu Toll Plaza",
    vehicleType: "VC7",
    vehicleRegNo: "MH19JK3923"
  }
];

export default function VehicleFastag() {
  const [fastagNo, setFastagNo] = useState("");
  const [results, setResults] = useState(sampleFastagTransactions);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Simulate API call with sample data
  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Replace this with actual API call
    setTimeout(() => {
      setResults(sampleFastagTransactions);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="register-vehicle-content">
      <h2 style={{ marginBottom: 18 }}>Vehicle Fastag</h2>
      <div className="card">
        <form className="register-vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="fastagNo">Fastag No.</label>
            <input
              type="text"
              id="fastagNo"
              name="fastagNo"
              className="form-control"
              value={fastagNo}
              onChange={e => setFastagNo(e.target.value)}
              placeholder="Enter Fastag number"
            />
          </div>
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Searching..." : "Search Fastag"}
            </button>
          </div>
          {error && <div style={{ color: "#d32f2f", marginTop: 4, width: '100%' }}>{error}</div>}
        </form>
      </div>
      <h3 style={{ margin: "32px 0 12px" }}>Fastag Transactions</h3>
      <div className="dashboard-latest">
        <table className="latest-table" style={{ width: "100%", marginBottom: 32 }}>
          <thead>
            <tr>
              <th>Read Time</th>
              <th>Seq No</th>
              <th>Lane Direction</th>
              <th>Toll Plaza</th>
              <th>Vehicle Type</th>
              <th>Vehicle No</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "#888", padding: "8px" }}>No transactions found.</td>
              </tr>
            ) : (
              results.map((txn, idx) => (
                <tr key={txn.seqNo || idx}>
                  <td>{txn.readerReadTime}</td>
                  <td>{txn.seqNo}</td>
                  <td>{txn.laneDirection}</td>
                  <td>{txn.tollPlazaName}</td>
                  <td>{txn.vehicleType}</td>
                  <td>{txn.vehicleRegNo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
