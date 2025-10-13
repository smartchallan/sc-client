import React, { useEffect, useState } from "react";
import "./ClientDashboard.css";
import CustomModal from "./CustomModal";

export default function VehicleDataTable({ clientId }) {
  // Helper to format expiry columns with color logic (red <=30 days, amber <=60 days, default otherwise)
  const formatExpiry = (dateStr, useColor = true) => {
    if (!dateStr || dateStr === '-') return '-';
    let d = null;
    if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) {
      d = new Date(dateStr.replace(/-/g, ' '));
    } else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      d = new Date(`${year}-${month}-${day}`);
    } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      d = new Date(dateStr);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
    if (!useColor) return formatted;
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  let color = 'green';
  let fontWeight = 'bold';
  if (diffDays <= 60) color = 'red';
  else if (diffDays <= 90) color = 'orange';
  else fontWeight = 'normal';
  return <span style={{color, fontWeight}}>{formatted}</span>;
  };
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/getvehiclertodata?clientId=${clientId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Vehicle RTO API response:", data);
        let arr = [];
        if (Array.isArray(data)) {
          // Map each item to its VehicleDetails inside rto_data
          arr = data.map(item => item.rto_data && item.rto_data.VehicleDetails ? item.rto_data.VehicleDetails : null).filter(Boolean);
        } else if (Array.isArray(data.vehicleDetails)) {
          arr = data.vehicleDetails;
        } else if (Array.isArray(data.vehicles)) {
          arr = data.vehicles;
        } else if (Array.isArray(data.data)) {
          arr = data.data;
        } else {
          // Try to find any array in the response
          for (const k in data) {
            if (Array.isArray(data[k])) {
              arr = data[k];
              break;
            }
          }
        }
        setVehicleData(arr);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch vehicle data.");
        setLoading(false);
      });
  }, [clientId]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  return (
    <div className="dashboard-latest" style={{marginTop:32}}>
      <h2 style={{fontSize:'1.2rem', marginBottom:12}}>Vehicle Data</h2>
      {loading && <div>Loading vehicle data...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
        <thead>
          <tr>
            <th>Vehicle No.</th>
            <th>Registration Date</th>
            <th>Insurance Exp</th>
            <th>Road Tax Exp</th>
            <th>Fitness Exp</th>
            <th>Pollution Exp</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {vehicleData.length === 0 ? (
            <tr><td colSpan={7}>No vehicle data found.</td></tr>
          ) : (
            vehicleData.map((v, idx) => (
              <tr key={v.rc_regn_no || idx}>
                <td>{v.rc_regn_no || '-'}</td>
                <td>{formatExpiry(v.rc_regn_dt, false)}</td>
                <td>{formatExpiry(v.insurance_exp || v.rc_insurance_upto, true)}</td>
                <td>{formatExpiry(v.road_tax_exp || v.rc_tax_upto, true)}</td>
                <td>{formatExpiry(v.fitness_exp || v.rc_fit_upto, true)}</td>
                <td>{formatExpiry(v.pollution_exp || v.rc_pucc_upto, true)}</td>
                <td style={{textAlign:'center'}}>
                  <button className="action-btn flat-btn" style={{padding:'4px 10px',fontSize:14}} onClick={() => setSelectedVehicle(v)}>
                    View Vehicle
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <CustomModal
        open={!!selectedVehicle}
        title={selectedVehicle ? `Vehicle RTO Data: ${selectedVehicle.rc_regn_no}` : ''}
        onConfirm={() => setSelectedVehicle(null)}
        onCancel={() => setSelectedVehicle(null)}
        confirmText="Close"
        cancelText={null}
      >
        {selectedVehicle && (
          <div style={{lineHeight:1.7, fontSize:15}}>
            <div><b>Vehicle No:</b> {selectedVehicle.rc_regn_no}</div>
            <div><b>Owner Name:</b> {selectedVehicle.rc_owner_name}</div>
            <div><b>Registration Date:</b> {formatExpiry(selectedVehicle.rc_regn_dt, false)}</div>
            <div><b>Insurance Expiry:</b> {formatExpiry(selectedVehicle.insurance_exp || selectedVehicle.rc_insurance_upto, false)}</div>
            <div><b>Road Tax Expiry:</b> {formatExpiry(selectedVehicle.road_tax_exp || selectedVehicle.rc_tax_upto, false)}</div>
            <div><b>Fitness Expiry:</b> {formatExpiry(selectedVehicle.fitness_exp || selectedVehicle.rc_fit_upto, false)}</div>
            <div><b>Pollution Expiry:</b> {formatExpiry(selectedVehicle.pollution_exp || selectedVehicle.rc_pucc_upto, false)}</div>
            <div><b>Chassis No:</b> {selectedVehicle.rc_chasi_no}</div>
            <div><b>Engine No:</b> {selectedVehicle.rc_engine_no}</div>
            <div><b>Vehicle Class:</b> {selectedVehicle.rc_vh_class_desc}</div>
            <div><b>Fuel Type:</b> {selectedVehicle.rc_fuel_desc}</div>
            <div><b>Maker:</b> {selectedVehicle.rc_maker_desc}</div>
            <div><b>Model:</b> {selectedVehicle.rc_maker_model}</div>
            <div><b>RTO:</b> {selectedVehicle.rc_off_cd}</div>
            <div><b>State:</b> {selectedVehicle.rc_state_cd}</div>
            <div><b>Mobile No:</b> {selectedVehicle.rc_mobile_no}</div>
            <div><b>Address:</b> {selectedVehicle.rc_present_address}</div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}
