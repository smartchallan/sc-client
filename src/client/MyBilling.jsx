import React, { useEffect, useState } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function MyBilling({ clientId }) {
  // Download as Excel
  const handleDownloadExcel = () => {
    if (!billingPlans || billingPlans.length === 0) return;
    const exportData = billingPlans.map(({ _raw, ...row }) => row);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BillingPlans");
    XLSX.writeFile(workbook, "billing_plans.xlsx");
  };

  // Print table
  const handlePrintTable = () => {
    const printContents = document.getElementById('my-billing-table-print-area')?.innerHTML;
    if (!printContents) return;
    const printWindow = window.open('', '', 'height=600,width=900');
    printWindow.document.write('<html><head><title>Print Billing Plans</title>');
    printWindow.document.write('<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f8fa;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };
  const [billingPlans, setBillingPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ startDate: "", endDate: "" });
  const [billResult, setBillResult] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/userbillingsetting?client_id=${clientId}`)
      .then(res => res.json())
      .then(data => {
        // Parse billingRecords key from response
        if (Array.isArray(data.billingRecords)) {
          setBillingPlans(data.billingRecords);
        } else {
          setBillingPlans([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch billing plans.");
        setLoading(false);
      });
  }, [clientId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setBillResult(null);
    if (!form.startDate || !form.endDate) return;
    // Example: Call billing calculation API (replace with actual endpoint if needed)
    try {
      setLoading(true);
      setError("");
      // Replace with actual calculation API if available
      // For now, just filter billingPlans by date range
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const filtered = billingPlans.filter(plan => {
        const planStart = new Date(plan.plan_start_dt);
        const planEnd = new Date(plan.plan_end_dt);
        return planStart <= end && planEnd >= start;
      });
      setBillResult(filtered);
      setLoading(false);
    } catch {
      setError("Failed to calculate bill.");
      setLoading(false);
    }
  };

  return (
    <div className="client-billing-content" style={{marginTop:32}}>
      <h2 style={{fontSize:'1.2rem', marginBottom:12}}>My Billing</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0', gap: 10 }}>
        <button onClick={handleDownloadExcel} title="Download Excel" style={{ padding: '8px 16px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FaDownload size={18} />
        </button>
        <button onClick={handlePrintTable} title="Print" style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FaPrint size={18} />
        </button>
      </div>
      <div id="my-billing-table-print-area">
        <table className="latest-table" style={{width:'100%', marginBottom:24}}>
        <thead>
          <tr>
            <th>Billing Type</th>
            <th>Cost/Vehicle/Month</th>
            <th>Cost/Challan</th>
            <th>Status</th>
            <th>Plan Start</th>
            <th>Plan End</th>
          </tr>
        </thead>
        <tbody>
          {billingPlans.length === 0 ? (
            <tr><td colSpan={6}>No billing plans found.</td></tr>
          ) : (
            billingPlans.map((plan, idx) => (
              <tr key={plan.id || plan._id || idx}>
                <td>{plan.billing_type}</td>
                <td>{plan.cost_per_month_per_vehicle}</td>
                <td>{plan.cost_per_challan_request}</td>
                <td style={plan.billing_plan_status === 'active' ? { color: 'green', fontWeight: 600 } : {}}>{plan.billing_plan_status}</td>
                <td>{plan.plan_start_dt ? plan.plan_start_dt.split("T")[0] : ""}</td>
                <td>{plan.plan_end_dt ? plan.plan_end_dt.split("T")[0] : ""}</td>
              </tr>
            ))
          )}
        </tbody>
  </table>
  </div>
  <form className="dealer-form" onSubmit={handleSubmit} style={{maxWidth:500, marginTop:24}}>
        <div className="form-row">
          <div className="form-col" style={{width:'50%'}}>
            <label>Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className="form-control" />
          </div>
          <div className="form-col" style={{width:'50%'}}>
            <label>End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required className="form-control" />
          </div>
        </div>
        <div className="button-group">
          <button type="submit" className="btn btn-primary">Get My Bill</button>
        </div>
      </form>
      {billResult && (
        <div style={{marginTop:24}}>
          <h3>Billing Plans in Selected Range</h3>
          <table className="latest-table" style={{width:'100%'}}>
            <thead>
              <tr>
                <th>Billing Type</th>
                <th>Cost/Vehicle/Month</th>
                <th>Cost/Challan</th>
                <th>Status</th>
                <th>Plan Start</th>
                <th>Plan End</th>
              </tr>
            </thead>
            <tbody>
              {billResult.length === 0 ? (
                <tr><td colSpan={6}>No plans in selected range.</td></tr>
              ) : (
                billResult.map((plan, idx) => (
                  <tr key={plan.id || plan._id || idx}>
                    <td>{plan.billing_type}</td>
                    <td>{plan.cost_per_month_per_vehicle}</td>
                    <td>{plan.cost_per_challan_request}</td>
                    <td style={plan.billing_plan_status === 'active' ? { color: 'green', fontWeight: 600 } : {}}>{plan.billing_plan_status}</td>
                    <td>{plan.plan_start_dt ? plan.plan_start_dt.split("T")[0] : ""}</td>
                    <td>{plan.plan_end_dt ? plan.plan_end_dt.split("T")[0] : ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
