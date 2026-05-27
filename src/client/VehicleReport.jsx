import React, { useState, useEffect, useCallback } from 'react';
import { generateVehicleReportHTML } from '../utils/generateVehicleReportHTML';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('sc_user')) || {};
  } catch {
    return {};
  }
}

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getAuthHeaders() {
  try {
    const u = getUser();
    const token = u.token || u.access_token || u.jwt || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function VehicleReport() {
  const userObj = getUser();
  const clientId = userObj?.user?.id || userObj?.user?.client_id || userObj?.user?._id;
  const logoUrl = import.meta.env.VITE_COMPANY_LOGO_URL || 'https://smartchallan.com/assets/logo-nzYj3r8Q.png';

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateSuccess, setGenerateSuccess] = useState('');

  const [reports, setReports] = useState([]);
  const [limit, setLimit] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');

  const [viewingId, setViewingId] = useState(null);

  const fetchList = useCallback(async () => {
    if (!clientId) return;
    setLoadingList(true);
    setListError('');
    try {
      const res = await fetch(`${API_ROOT}/vehiclereport/list?client_id=${encodeURIComponent(clientId)}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReports(data.reports || []);
        setLimit(data.limit || 0);
      } else {
        setListError(data.error || 'Failed to load reports');
      }
    } catch {
      setListError('Network error. Please try again.');
    } finally {
      setLoadingList(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    const vNum = vehicleNumber.trim().toUpperCase();
    if (!vNum) return;
    setGenerating(true);
    setGenerateError('');
    setGenerateSuccess('');
    try {
      const res = await fetch(`${API_ROOT}/vehiclereport/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ vehicleNumber: vNum, clientId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGenerateSuccess(`Report generated for ${vNum}`);
        setVehicleNumber('');
        await fetchList();
      } else if (res.status === 429) {
        if (data.error === 'ULIP_QUOTA_EXCEEDED') {
          setGenerateError('Daily API quota exhausted. Please try again tomorrow.');
        } else {
          setGenerateError(data.error || 'Report limit reached. Please contact your dealer.');
        }
      } else if (res.status === 403) {
        setGenerateError(data.error || 'Feature not enabled. Please contact your dealer.');
      } else {
        setGenerateError(data.error || 'Failed to generate report.');
      }
    } catch {
      setGenerateError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReport = async (reportId) => {
    setViewingId(reportId);
    try {
      const res = await fetch(`${API_ROOT}/vehiclereport/${reportId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const html = generateVehicleReportHTML({
          vehicleNumber: data.vehicle_number,
          rtoData: data.rto_data,
          challanData: data.challan_data,
          rtoStatus: data.rto_status,
          challanStatus: data.challan_status,
          generatedAt: data.generated_at,
          expiresAt: data.expires_at,
          logoUrl,
        });
        const win = window.open('', '_blank', 'width=900,height=700');
        if (win) {
          win.document.open();
          win.document.write(html);
          win.document.close();
        } else {
          alert('Popup blocked. Please allow popups for this site.');
        }
      } else {
        alert(data.error || 'Failed to load report.');
      }
    } catch {
      alert('Network error loading report.');
    } finally {
      setViewingId(null);
    }
  };

  const usedCount = reports.length;

  return (
    <div style={{ padding: '24px 18px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ri-file-search-line" style={{ fontSize: 26 }}></i>
          Vehicle Report
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Generate a comprehensive history report for any vehicle — includes RTO registration details and challan records.
        </p>
        {limit > 0 && (
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '4px 12px', fontSize: 13, color: '#1d4ed8' }}>
            <i className="ri-bar-chart-line"></i>
            {usedCount} / {limit} reports used
          </div>
        )}
      </div>

      {/* Generate Form */}
      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 16 }}>Generate New Report</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="Enter vehicle number (e.g. MH12AB1234)"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
                letterSpacing: '0.05em',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              disabled={generating}
              maxLength={12}
            />
          </div>
          <button
            type="submit"
            disabled={generating || !vehicleNumber.trim()}
            style={{
              padding: '10px 22px',
              background: generating ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: generating || !vehicleNumber.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {generating ? (
              <>
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                Generating…
              </>
            ) : (
              <>
                <i className="ri-file-add-line"></i>
                Generate Report
              </>
            )}
          </button>
        </form>

        {generateError && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-error-warning-line"></i>
            {generateError}
          </div>
        )}
        {generateSuccess && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-checkbox-circle-line"></i>
            {generateSuccess}
          </div>
        )}
      </div>

      {/* Report History */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: 0 }}>Report History</h3>
          <button
            onClick={fetchList}
            disabled={loadingList}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <i className={`ri-refresh-line ${loadingList ? 'spin-icon' : ''}`}></i>
            Refresh
          </button>
        </div>

        {listError && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
            {listError}
          </div>
        )}

        {loadingList ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 1s linear infinite' }}></i>
            <div style={{ marginTop: 8, fontSize: 13 }}>Loading reports…</div>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', background: '#f8fafc', borderRadius: 14, border: '1.5px dashed #e2e8f0' }}>
            <i className="ri-file-search-line" style={{ fontSize: 40, display: 'block', marginBottom: 10 }}></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>No reports generated yet</div>
            <div style={{ fontSize: 13 }}>Enter a vehicle number above to generate your first report.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.map((report) => {
              const isExpired = report.status === 'expired';
              const isViewing = viewingId === report.id;
              return (
                <div
                  key={report.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 18px',
                    background: isExpired ? '#f8fafc' : '#fff',
                    border: `1.5px solid ${isExpired ? '#e2e8f0' : '#dbeafe'}`,
                    borderRadius: 12,
                    boxShadow: isExpired ? 'none' : '0 1px 6px #1d4ed808',
                    opacity: isExpired ? 0.7 : 1,
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: isExpired ? '#f1f5f9' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ri-file-text-line" style={{ fontSize: 22, color: isExpired ? '#94a3b8' : '#2563eb' }}></i>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: isExpired ? '#64748b' : '#1e293b', letterSpacing: '0.04em' }}>
                      {report.vehicle_number}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span><i className="ri-calendar-line"></i> Generated: {formatDate(report.generated_at)}</span>
                      <span><i className="ri-time-line"></i> Expires: {formatDate(report.expires_at)}</span>
                      <span style={{ display: 'flex', gap: 6 }}>
                        <DataBadge status={report.rto_status} label="RTO" />
                        <DataBadge status={report.challan_status} label="Challan" />
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: isExpired ? '#f1f5f9' : '#dcfce7',
                      color: isExpired ? '#64748b' : '#15803d',
                      border: `1px solid ${isExpired ? '#e2e8f0' : '#bbf7d0'}`,
                    }}>
                      {isExpired ? 'Expired' : 'Active'}
                    </span>

                    <button
                      onClick={() => handleViewReport(report.id)}
                      disabled={isViewing}
                      title={isExpired ? 'View expired report' : 'View / Download PDF'}
                      style={{
                        padding: '7px 14px',
                        background: isViewing ? '#93c5fd' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isViewing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      {isViewing ? (
                        <><i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i> Loading…</>
                      ) : (
                        <><i className="ri-eye-line"></i> View</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

function DataBadge({ status, label }) {
  const ok = status === 'success';
  const noData = status === 'no_challans' || status === 'not_available';
  const color = ok ? '#15803d' : noData ? '#92400e' : '#64748b';
  const bg = ok ? '#dcfce7' : noData ? '#fef3c7' : '#f1f5f9';
  const border = ok ? '#bbf7d0' : noData ? '#fde68a' : '#e2e8f0';
  const icon = ok ? 'ri-checkbox-circle-fill' : noData ? 'ri-information-line' : 'ri-close-circle-line';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: bg, color, border: `1px solid ${border}` }}>
      <i className={icon}></i>
      {label}
    </span>
  );
}
