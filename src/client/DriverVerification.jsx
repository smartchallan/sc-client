import React, { useState } from "react";
import "../RegisterVehicle.css";

export default function DriverVerification() {
  const [drivers, setDrivers] = useState([
    { licenseNo: "DL0420150001234", dob: "1990-05-12" },
    { licenseNo: "MH1220180005678", dob: "1985-11-23" }
  ]);
  const [form, setForm] = useState({ licenseNo: "", dob: "" });
  const [error, setError] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.licenseNo || !form.dob) {
      setError("Please fill both fields.");
      return;
    }
    setDrivers([...drivers, { licenseNo: form.licenseNo, dob: form.dob }]);
    setForm({ licenseNo: "", dob: "" });
    setError("");
  };

  return (
    <div className="register-vehicle-content">
      <h2 style={{ marginBottom: 18 }}>Registered Drivers</h2>
      <div className="dashboard-latest">
        <table className="latest-table" style={{ width: "100%", marginBottom: 32 }}>
          <thead>
            <tr>
              <th>License No.</th>
              <th>DOB</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ color: "#888", padding: "8px" }}>No drivers registered.</td>
              </tr>
            ) : (
              drivers.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "8px", borderBottom: "1px solid #f5f5f5" }}>{d.licenseNo}</td>
                  <td style={{ padding: "8px", borderBottom: "1px solid #f5f5f5" }}>{d.dob}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginBottom: 12 }}>Register New Driver</h3>
      <div className="card">
        <form className="register-vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="licenseNo">License No.</label>
            <input
              type="text"
              id="licenseNo"
              name="licenseNo"
              className="form-control"
              value={form.licenseNo}
              onChange={handleChange}
              placeholder="Enter license number"
            />
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="dob">DOB</label>
            <input
              type="date"
              id="dob"
              name="dob"
              className="form-control"
              value={form.dob}
              onChange={handleChange}
              placeholder="Enter date of birth"
            />
          </div>
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary">Register Driver</button>
          </div>
          {error && <div style={{ color: "#d32f2f", marginTop: 4, width: '100%' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
