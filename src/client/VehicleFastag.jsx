import React, { useState } from "react";
import "../RegisterVehicle.css";

// Add CSS animations for spinner and number plate effects
const keyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .number-plate-container:hover .number-plate-bg {
    box-shadow: 0 4px 12px rgba(0,114,255,0.15);
    border-color: #0072ff;
  }
  
  .number-plate-container:focus-within .number-plate-bg {
    box-shadow: 0 4px 12px rgba(0,114,255,0.2);
    border-color: #0072ff;
  }
  
  @media (max-width: 600px) {
    .number-plate-container {
      max-width: 100% !important;
    }
    
    .number-plate-input {
      font-size: 18px !important;
    }
  }
  
  @media (max-width: 480px) {
    .number-plate-input {
      font-size: 16px !important;
    }
  }
`;

// Inject CSS into document head
if (!document.querySelector('#fastag-animations')) {
  const style = document.createElement('style');
  style.id = 'fastag-animations';
  style.textContent = keyframes;
  document.head.appendChild(style);
}

export default function VehicleFastag() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!vehicleNumber.trim()) {
      setError("Please enter a vehicle number");
      return;
    }

    setError("");
    setLoading(true);
    setResults([]);
    setApiResponse(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/getvehiclefastagdata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
        },
        body: JSON.stringify({
          vehiclenumber: vehicleNumber.trim()
        })
      });

      const data = await response.json();
      console.log('Full API Response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch FasTag data');
      }

      setApiResponse(data);

      // Parse the response structure based on your sample
      if (data.response && data.response.length > 0) {
        const responseData = data.response[0];
        
        if (responseData.response && responseData.response.result === "SUCCESS") {
          const vehicle = responseData.response.vehicle;
          
          if (vehicle && vehicle.vehltxnList && vehicle.vehltxnList.txn) {
            setResults(vehicle.vehltxnList.txn);
          } else {
            setError("No transaction data found in the response");
          }
        } else {
          setError(`API Error: ${responseData.response?.result || 'Unknown error'}`);
        }
      } else {
        setError("No data found in response");
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || "Failed to fetch FasTag data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-vehicle-content">
      <h2 style={{ marginBottom: 18 }}>Vehicle FasTag Transactions</h2>
      <div className="card">
        <form className="register-vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="vehicleNumber" style={{fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block'}}>Vehicle Number</label>
            <div className="number-plate-container">
              <div className="number-plate-wrapper">
                <div className="number-plate-badge">IND</div>
                <div className="tricolor-strip">
                  <div className="saffron"></div>
                  <div className="white"></div>
                  <div className="green"></div>
                </div>
                <input
                  type="text"
                  id="vehicleNumber"
                  name="vehicleNumber"
                  className="number-plate-input"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="Enter vehicle number"
                  disabled={loading}
                  maxLength={12}
                />
              </div>
              <div className="security-features">
                <div className="hologram"></div>
                <div className="chakra">⚙</div>
              </div>
            </div>
            <small style={{fontSize: 12, color: '#6c757d', marginTop: 4, display: 'block'}}>
              Enter vehicle registration number (e.g., GJ18AZ1990) • Commercial vehicles only
            </small>
          </div>
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={loading || !vehicleNumber.trim()}>
              <i className={loading ? "ri-loader-4-line" : "ri-search-line"} style={{
                marginRight: 8,
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}></i>
              {loading ? "Fetching Transactions..." : "Get Vehicle FasTag Data"}
            </button>
          </div>
          {error && (
            <div style={{ 
              color: "#d32f2f", 
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: 6,
              padding: '12px 16px',
              marginTop: 4, 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <i className="ri-error-warning-line"></i>
              {error}
            </div>
          )}
        </form>
      </div>
      {/* API Response Summary */}
      {apiResponse && (
        <div className="card" style={{ margin: "24px 0" }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#28a745", display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-check-circle-line"></i>
            FasTag Data Retrieved Successfully
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6c757d', marginBottom: 4 }}>Total Records</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0072ff' }}>
                {apiResponse.response?.[0]?.response?.vehicle?.vehltxnList?.totalTagsInresponse || '0'}
              </div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6c757d', marginBottom: 4 }}>Response Status</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: apiResponse.response?.[0]?.response?.result === 'SUCCESS' ? '#28a745' : '#dc3545' }}>
                {apiResponse.response?.[0]?.response?.result || 'Unknown'}
              </div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6c757d', marginBottom: 4 }}>Response Code</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#495057' }}>
                {apiResponse.response?.[0]?.response?.respCode || 'N/A'}
              </div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6c757d', marginBottom: 4 }}>Timestamp</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#495057' }}>
                {apiResponse.response?.[0]?.response?.ts ? new Date(apiResponse.response[0].response.ts).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ margin: "32px 0 12px", display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="ri-road-map-line"></i>
        FasTag Transaction History
        {results.length > 0 && (
          <span style={{ 
            background: '#0072ff', 
            color: '#fff', 
            padding: '4px 8px', 
            borderRadius: 12, 
            fontSize: 12, 
            fontWeight: 600,
            marginLeft: 8
          }}>
            {results.length} transactions
          </span>
        )}
      </h3>
      
      <div className="dashboard-latest">
        <div style={{ overflowX: 'auto' }}>
          <table className="latest-table" style={{ width: "100%", marginBottom: 32, minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Date & Time</th>
                <th style={{ minWidth: 120 }}>Vehicle No</th>
                <th style={{ minWidth: 200 }}>Toll Plaza</th>
                <th style={{ minWidth: 100 }}>Direction</th>
                <th style={{ minWidth: 100 }}>Vehicle Type</th>
                <th style={{ minWidth: 120 }}>Location</th>
                <th style={{ minWidth: 150 }}>Sequence No</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ 
                    color: "#888", 
                    padding: "24px 8px", 
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <i className="ri-file-search-line" style={{ fontSize: 32, opacity: 0.5 }}></i>
                      {vehicleNumber ? 'No transactions found for this vehicle number.' : 'Enter a vehicle number to search for transactions.'}
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((txn, idx) => (
                  <tr key={txn.seqNo || idx} style={{ 
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: "12px 8px", fontSize: 14 }}>
                      <div style={{ fontWeight: 600, color: '#495057' }}>
                        {new Date(txn.readerReadTime).toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ fontSize: 12, color: '#6c757d' }}>
                        {new Date(txn.readerReadTime).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 14, fontWeight: 600, color: '#0072ff' }}>
                      {txn.vehicleRegNo || 'N/A'}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 14 }}>
                      <div style={{ fontWeight: 500, color: '#495057' }}>
                        {txn.tollPlazaName || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 14, textAlign: 'center' }}>
                      <span style={{
                        background: txn.laneDirection === 'N' ? '#e3f2fd' : txn.laneDirection === 'S' ? '#fff3e0' : txn.laneDirection === 'E' ? '#f3e5f5' : '#e8f5e8',
                        color: txn.laneDirection === 'N' ? '#1976d2' : txn.laneDirection === 'S' ? '#f57c00' : txn.laneDirection === 'E' ? '#7b1fa2' : '#388e3c',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {txn.laneDirection === 'N' ? '↑ North' : 
                         txn.laneDirection === 'S' ? '↓ South' : 
                         txn.laneDirection === 'E' ? '→ East' : 
                         txn.laneDirection === 'W' ? '← West' : 
                         txn.laneDirection || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 14, textAlign: 'center' }}>
                      <span style={{
                        background: '#f1f3f5',
                        color: '#495057',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {txn.vehicleType || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12, color: '#6c757d' }}>
                      {txn.tollPlazaGeocode && txn.tollPlazaGeocode !== '11.0001,11.0001' ? (
                        <a 
                          href={`https://www.google.com/maps?q=${txn.tollPlazaGeocode}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#0072ff', 
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <i className="ri-map-pin-line"></i>
                          View Location
                        </a>
                      ) : (
                        <span style={{ color: '#888' }}>No coordinates</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: 12, color: '#6c757d', wordBreak: 'break-all' }}>
                      {txn.seqNo || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {results.length > 0 && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: '#f8f9fa', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            color: '#6c757d'
          }}>
            <i className="ri-information-line"></i>
            <div>
              <strong>Note:</strong> Transactions are sorted by date and time. Click on "View Location" to see the toll plaza location on Google Maps.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
