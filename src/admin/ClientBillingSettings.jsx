import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

export default function ClientBillingSettings({ clients = [] }) {
  const [form, setForm] = useState({
    user_id: "",
    user_type: "client",
    billing_type: "prepaid",
    cost_per_month_per_vehicle: "",
    cost_per_challan_request: "",
    billing_plan_status: "active"
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // No plan_start_dt or plan_end_dt needed

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const url = `${API_ROOT}/userbillingsetting`;
      const payload = {
        ...form,
        cost_per_month_per_vehicle: parseFloat(form.cost_per_month_per_vehicle),
        cost_per_challan_request: parseFloat(form.cost_per_challan_request)
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        setMessage("Billing settings updated successfully.");
      } else {
        setMessage(result.message || "Failed to update billing settings.");
      }
    } catch (err) {
      setMessage("Error updating billing settings.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-vehicle-content" style={{marginTop:32}}>
      <h2 style={{fontSize:'1.2rem', marginBottom:12}}>Client Billing Settings</h2>
      <form className="dealer-form" onSubmit={handleSubmit} style={{maxWidth:600}}>
        <div className="form-row">
          <div className="form-col" style={{width:'50%'}}>
            <label>Client</label>
            <select name="user_id" value={form.user_id} onChange={handleChange} required className="form-control">
              <option value="">Select Client</option>
              {clients.map(c => (
                <option key={c.id || c._id || c.email} value={c.id || c._id}>{c.name || c.email}</option>
              ))}
            </select>
          </div>
          <div className="form-col" style={{width:'50%'}}>
            <label>Billing Type</label>
            <select name="billing_type" value={form.billing_type} onChange={handleChange} required className="form-control">
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-col" style={{width:'50%'}}>
            <label>Cost per vehicle per month (₹)</label>
            <input type="number" name="cost_per_month_per_vehicle" value={form.cost_per_month_per_vehicle} onChange={handleChange} required min="0" step="0.01" className="form-control" />
          </div>
          <div className="form-col" style={{width:'50%'}}>
            <label>Cost per challan request (₹)</label>
            <input type="number" name="cost_per_challan_request" value={form.cost_per_challan_request} onChange={handleChange} required min="0" step="0.01" className="form-control" />
          </div>
        </div>
        <div className="button-group">
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Billing Settings"}</button>
        </div>
        {message && <div style={{marginTop:12, color: message.includes("success") ? "green" : "red"}}>{message}</div>}
      </form>
    </div>
  );
}
