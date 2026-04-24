import React, { useState, useEffect, useRef } from "react";
import SelectShowMore from "./SelectShowMore";

const DEFAULT_LIMIT = 30;

const keyframes = `
  @keyframes ft-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes ft-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;
if (!document.querySelector('#fastag-animations')) {
  const s = document.createElement('style');
  s.id = 'fastag-animations';
  s.textContent = keyframes;
  document.head.appendChild(s);
}

function getClientId() {
  try {
    const stored = JSON.parse(localStorage.getItem("sc_user"));
    const user = stored && stored.user ? stored.user : {};
    return user.client_id || user.id || user._id || null;
  } catch { return null; }
}

const DIRECTION_MAP = {
  N: { label: '↑ North', bg: '#e0f2fe', color: '#0369a1' },
  S: { label: '↓ South', bg: '#fff7ed', color: '#c2410c' },
  E: { label: '→ East',  bg: '#f3e8ff', color: '#7c3aed' },
  W: { label: '← West',  bg: '#f0fdf4', color: '#15803d' },
};

export default function VehicleFastag() {
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_LIMIT);
  const wrapperRef = useRef(null);

  // Fetch registered vehicles for autocomplete
  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return;
    setLoadingVehicles(true);
    fetch(`${API_ROOT}/uservehicle?client_id=${clientId}`)
      .then(r => r.json())
      .then(data => {
        let list = Array.isArray(data) ? data : (Array.isArray(data.vehicles) ? data.vehicles : []);
        list = list.filter(v => !v.status || String(v.status).toUpperCase() !== 'DELETED');
        setVehicles(list);
      })
      .catch(() => setVehicles([]))
      .finally(() => setLoadingVehicles(false));
  }, []);

  useEffect(() => {
    const search = vehicleNumber.trim().toUpperCase();
    let list = vehicles;
    if (search) list = vehicles.filter(v => (v.vehicle_number || "").toUpperCase().includes(search));
    setFilteredVehicles(list.slice(0, 10));
  }, [vehicleNumber, vehicles]);

  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset visible count when new results arrive
  useEffect(() => { setVisibleCount(DEFAULT_LIMIT); }, [results]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!vehicleNumber.trim()) { setError("Please enter a vehicle number"); return; }
    setError(""); setLoading(true); setResults([]); setApiResponse(null);
    try {
      const res = await fetch(`${API_ROOT}/getvehiclefastagdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehiclenumber: vehicleNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch FasTag data');
      setApiResponse(data);
      const responseData = data.response?.[0];
      if (responseData?.response?.result === "SUCCESS") {
        const txns = responseData.response.vehicle?.vehltxnList?.txn;
        if (txns) {
          const sorted = [...txns].sort((a, b) => new Date(b.readerReadTime) - new Date(a.readerReadTime));
          setResults(sorted);
        } else {
          setError("No transaction data found in the response");
        }
      } else {
        setError(`API Error: ${responseData?.response?.result || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch FasTag data");
    } finally {
      setLoading(false);
    }
  };

  const displayed = results.slice(0, visibleCount);
  const apiStatus = apiResponse?.response?.[0]?.response?.result;
  const totalRecords = apiResponse?.response?.[0]?.response?.vehicle?.vehltxnList?.totalTagsInresponse || 0;

  return (
    <div className="register-vehicle-content">
      <style>{`
        .ft-card { background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(37,99,235,0.08); border:1px solid #e2e8f0; overflow:hidden; margin-bottom:20px; }
        .ft-card-header { background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%); padding:18px 24px; display:flex; align-items:center; gap:12px; }
        .ft-stat { background:#f8fafc; border-radius:10px; padding:14px 18px; border:1px solid #e2e8f0; }
        .ft-stat-label { font-size:12px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
        .ft-stat-value { font-size:22px; font-weight:700; color:#1e293b; }
        .ft-table { width:100%; border-collapse:collapse; }
        .ft-table th { background:#f8fafc; padding:10px 14px; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.04em; text-align:left; border-bottom:2px solid #e2e8f0; white-space:nowrap; }
        .ft-table td { padding:12px 14px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .ft-table tr:hover td { background:#f8fafc; }
        .ft-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ri-road-map-line" style={{ color: '#fff', fontSize: 22 }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>FasTag Details</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>View toll transaction history for commercial vehicles</p>
        </div>
      </div>

      {/* Search card */}
      <div className="ft-card">
        <div className="ft-card-header">
          <i className="ri-search-eye-line" style={{ color: '#fff', fontSize: 20 }} />
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Search FasTag Transactions</div>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Vehicle number input */}
            <div style={{ flex: '1 1 260px', minWidth: 220 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Vehicle Number
              </label>
              <div style={{ position: 'relative' }} ref={wrapperRef}>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={e => { setVehicleNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={loadingVehicles ? "Loading vehicles..." : "Select or type vehicle number"}
                  disabled={loading}
                  maxLength={12}
                  autoComplete="off"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 36px 10px 14px',
                    border: `1.5px solid ${vehicleNumber ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 10, fontSize: 14, outline: 'none',
                    background: '#f8fafc', color: '#1e293b',
                    boxShadow: vehicleNumber ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { if (!vehicleNumber) { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; } }}
                />
                {vehicleNumber && (
                  <button type="button" onClick={() => { setVehicleNumber(''); setResults([]); setApiResponse(null); setError(''); }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, lineHeight: 1 }}>
                    <i className="ri-close-circle-fill" style={{ fontSize: 16 }} />
                  </button>
                )}

                {showDropdown && filteredVehicles.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
                    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden',
                  }}>
                    {filteredVehicles.map(v => {
                      const vn = (v.vehicle_number || '').toUpperCase();
                      return (
                        <div key={v.id || v._id || vn}
                          onMouseDown={e => { e.preventDefault(); setVehicleNumber(vn); setShowDropdown(false); }}
                          style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{vn || 'N/A'}</span>
                          {v.status && (
                            <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{v.status}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Commercial vehicles only</div>
            </div>

            {/* Submit button */}
            <div>
              <button type="submit" disabled={loading || !vehicleNumber.trim()}
                style={{
                  padding: '11px 24px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (!loading && vehicleNumber.trim()) ? 'pointer' : 'not-allowed',
                  background: (!loading && vehicleNumber.trim()) ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0',
                  color: (!loading && vehicleNumber.trim()) ? '#fff' : '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                  boxShadow: (!loading && vehicleNumber.trim()) ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                  transition: 'all 0.2s',
                }}>
                <i className={loading ? 'ri-loader-4-line' : 'ri-search-line'} style={{ animation: loading ? 'ft-spin 1s linear infinite' : 'none' }} />
                {loading ? 'Fetching...' : 'Get FasTag Data'}
              </button>
            </div>
          </form>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'center' }}>
              <i className="ri-error-warning-line" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {apiResponse && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20, animation: 'ft-fadeIn 0.3s ease' }}>
          <div className="ft-stat">
            <div className="ft-stat-label">Total Records</div>
            <div className="ft-stat-value" style={{ color: '#2563eb' }}>{totalRecords}</div>
          </div>
          <div className="ft-stat">
            <div className="ft-stat-label">Status</div>
            <div style={{ marginTop: 4 }}>
              <span className="ft-badge" style={{ background: apiStatus === 'SUCCESS' ? '#dcfce7' : '#fee2e2', color: apiStatus === 'SUCCESS' ? '#15803d' : '#dc2626', fontSize: 14, fontWeight: 700 }}>
                {apiStatus === 'SUCCESS' ? <><i className="ri-check-line" style={{ marginRight: 4 }} />Success</> : apiStatus || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="ft-stat">
            <div className="ft-stat-label">Response Code</div>
            <div className="ft-stat-value" style={{ fontSize: 16 }}>{apiResponse?.response?.[0]?.response?.respCode || 'N/A'}</div>
          </div>
          <div className="ft-stat">
            <div className="ft-stat-label">Fetched At</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginTop: 4 }}>
              {apiResponse?.response?.[0]?.response?.ts ? new Date(apiResponse.response[0].response.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Transactions table card */}
      <div className="ft-card">
        <div className="ft-card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ri-route-line" style={{ color: '#fff', fontSize: 20 }} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>FasTag Transaction History</div>
          </div>
          {results.length > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {results.length} transactions
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ft-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Vehicle No.</th>
                <th>Toll Plaza</th>
                <th>Direction</th>
                <th>Vehicle Type</th>
                <th>Location</th>
                <th>Seq. No.</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <i className="ri-file-search-line" style={{ fontSize: 36, color: '#cbd5e1', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>
                      {vehicleNumber ? 'No transactions found for this vehicle.' : 'Enter a vehicle number above to search.'}
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((txn, idx) => {
                  const dir = DIRECTION_MAP[txn.laneDirection] || { label: txn.laneDirection || 'N/A', bg: '#f1f5f9', color: '#475569' };
                  const dt = new Date(txn.readerReadTime);
                  return (
                    <tr key={txn.seqNo || idx}>
                      <td style={{ color: '#94a3b8', fontWeight: 500 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                          {txn.vehicleRegNo || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>{txn.tollPlazaName || 'N/A'}</td>
                      <td>
                        <span className="ft-badge" style={{ background: dir.bg, color: dir.color }}>{dir.label}</span>
                      </td>
                      <td>
                        <span className="ft-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{txn.vehicleType || 'N/A'}</span>
                      </td>
                      <td>
                        {txn.tollPlazaGeocode && txn.tollPlazaGeocode !== '11.0001,11.0001' ? (
                          <a href={`https://www.google.com/maps?q=${txn.tollPlazaGeocode}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                            <i className="ri-map-pin-2-line" />View Map
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: 12 }}>No coords</span>
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: '#94a3b8', wordBreak: 'break-all', maxWidth: 140 }}>{txn.seqNo || 'N/A'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {results.length > DEFAULT_LIMIT && (
          <div className="vst-show-more" style={{ padding: '14px 24px' }}>
            <span className="vst-show-more__label">Show more records:</span>
            <SelectShowMore
              onShowMoreRecords={val => {
                if (val === 'all') setVisibleCount(results.length);
                else setVisibleCount(Number(val));
              }}
              onResetRecords={() => setVisibleCount(DEFAULT_LIMIT)}
              maxCount={results.length}
            />
          </div>
        )}

        {results.length > 0 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            <i className="ri-information-line" />
            Sorted newest first · Click "View Map" to see the toll plaza location on Google Maps
          </div>
        )}
      </div>
    </div>
  );
}
