import React, { useEffect, useState } from "react";

export default function VehicleRtoDataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://server.smartchallan.com/getvehiclertodata?clientId=20");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="modern-form-card" style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Vehicle RTO Data Table</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table className="vehicle-challan-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Vehicle Number</th>
              <th>Engine Number</th>
              <th>Chasis Number</th>
              <th>Status</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
            {data.map((v, idx) => {
              const details = v.rto_data?.VehicleDetails || {};
              const status = (details.rc_status || '').toUpperCase();
              let statusColor = '#888';
              if (status === 'ACTIVE') statusColor = 'green';
              else if (status === 'INACTIVE') statusColor = 'orange';
              else if (status === 'DELETED') statusColor = 'red';
              return (
                <tr key={v.id || v.vehicle_number || idx}>
                  <td>{idx + 1}</td>
                  <td>{v.vehicle_number || 'Not Available'}</td>
                  <td>{details.rc_eng_no || 'Not Available'}</td>
                  <td>{details.rc_chasi_no || 'Not Available'}</td>
                  <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status || 'Not Available'}</td>
                  <td>{v.created_at ? new Date(v.created_at).toLocaleString() : 'Not Available'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
