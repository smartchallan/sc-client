import React, { useState, useEffect, useCallback } from 'react';
import { generateVehicleReportHTML } from '../utils/generateVehicleReportHTML';

const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';

function getUser() {
  try { return JSON.parse(localStorage.getItem('sc_user')) || {}; } catch { return {}; }
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
  } catch { return {}; }
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
  const [downloadingId, setDownloadingId] = useState(null);

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

  useEffect(() => { fetchList(); }, [fetchList]);

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
        setGenerateSuccess(`Report generated successfully for ${vNum}`);
        setVehicleNumber('');
        await fetchList();
      } else if (res.status === 429) {
        setGenerateError(data.error === 'ULIP_QUOTA_EXCEEDED'
          ? 'Daily API quota exhausted. Please try again tomorrow.'
          : data.error || 'Report limit reached. Please contact your dealer.');
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

  const fetchReportData = async (reportId) => {
    const res = await fetch(`${API_ROOT}/vehiclereport/${reportId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load report');
    return data;
  };

  const handleViewReport = async (reportId) => {
    setViewingId(reportId);
    try {
      const data = await fetchReportData(reportId);
      const html = generateVehicleReportHTML({
        vehicleNumber: data.vehicle_number,
        rtoData: data.rto_data,
        challanData: data.challan_data,
        rtoStatus: data.rto_status,
        challanStatus: data.challan_status,
        generatedAt: data.generated_at,
        expiresAt: data.expires_at,
        logoUrl,
        autoPrint: false,
      });
      const win = window.open('', '_blank');
      if (win) { win.document.open(); win.document.write(html); win.document.close(); }
      else alert('Popup blocked. Please allow popups for this site.');
    } catch (err) {
      alert(err.message || 'Network error loading report.');
    } finally {
      setViewingId(null);
    }
  };

  const handleDownloadPdf = async (reportId, vehicleNum) => {
    setDownloadingId(reportId);
    let styleEl = null;
    let wrapper = null;
    try {
      const data = await fetchReportData(reportId);
      const html = generateVehicleReportHTML({
        vehicleNumber: data.vehicle_number,
        rtoData: data.rto_data,
        challanData: data.challan_data,
        rtoStatus: data.rto_status,
        challanStatus: data.challan_status,
        generatedAt: data.generated_at,
        expiresAt: data.expires_at,
        logoUrl,
        autoPrint: false,
      });

      // Extract CSS and body content from the full HTML string
      const cssContent = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
      const bodyContent = (html.match(/<body>([\s\S]*?)<\/body>/s) || [])[1] || '';

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Inject report styles scoped to avoid affecting the app
      // Scope the universal reset and body rule to the container
      const scopedCss = cssContent
        .replace('* { margin: 0; padding: 0; box-sizing: border-box; }', '#vr-pdf-wrap * { margin: 0; padding: 0; box-sizing: border-box; }')
        .replace(/body\s*\{/, '#vr-pdf-wrap {');

      styleEl = document.createElement('style');
      styleEl.textContent =
        scopedCss +
        '\n#vr-pdf-wrap .print-bar { display: none !important; }' +
        '\n#vr-pdf-wrap .page { width: 794px !important; min-height: unset !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; page-break-after: auto !important; }';
      document.head.appendChild(styleEl);

      // Off-screen container rendered in the same document (avoids iframe blank capture)
      wrapper = document.createElement('div');
      wrapper.id = 'vr-pdf-wrap';
      wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;';
      wrapper.innerHTML = bodyContent;
      document.body.appendChild(wrapper);

      // Give images and emoji time to render
      await new Promise(r => setTimeout(r, 700));

      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 22;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      // Capture each report page separately so PDF page breaks align to section
      // boundaries — prevents content from overlapping across A4 cuts.
      const pageEls = Array.from(wrapper.querySelectorAll('.page'));
      let first = true;
      for (const el of pageEls) {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: el.offsetWidth,
          height: el.offsetHeight,
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        // Scale to fit within margins, keeping aspect ratio (fit by width,
        // fall back to height if the page would be taller than one A4 sheet).
        let drawW = availW;
        let drawH = (canvas.height * drawW) / canvas.width;
        if (drawH > availH) {
          drawH = availH;
          drawW = (canvas.width * drawH) / canvas.height;
        }
        const x = (pageW - drawW) / 2;
        const y = margin;

        if (!first) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', x, y, drawW, drawH);
        first = false;
      }

      // Cleanup
      document.head.removeChild(styleEl);
      document.body.removeChild(wrapper);
      styleEl = null;
      wrapper = null;

      pdf.save(`Vehicle-Report-${data.vehicle_number || vehicleNum}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not generate PDF. Please use View → Print → Save as PDF as an alternative.');
    } finally {
      // Safety cleanup in case of error mid-way
      if (styleEl && document.head.contains(styleEl)) document.head.removeChild(styleEl);
      if (wrapper && document.body.contains(wrapper)) document.body.removeChild(wrapper);
      setDownloadingId(null);
    }
  };

  const usedCount = reports.length;
  const activeCount = reports.filter(r => r.status !== 'expired').length;
  const expiredCount = reports.filter(r => r.status === 'expired').length;

  return (
    <div style={{ padding: '4px 0' }}>
      <style>{`
        .vr-grid { display: grid; grid-template-columns: 400px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 960px) { .vr-grid { grid-template-columns: 1fr; } }
        @keyframes vr-spin { to { transform: rotate(360deg); } }
        .vr-spin { animation: vr-spin 0.9s linear infinite; }
      `}</style>

      <div className="vr-grid">

        {/* ── LEFT: Generate Panel ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* Blue gradient header */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ri-file-search-line" style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Vehicle Report</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>RTO + Challan history in one report</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{usedCount}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 3 }}>Total</div>
              </div>
              {limit > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                  <div style={{ color: usedCount >= limit ? '#fca5a5' : '#4ade80', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{limit - usedCount}</div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 3 }}>Left</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <form onSubmit={handleGenerate}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Vehicle Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. MH12AB1234"
                maxLength={12}
                disabled={generating}
                style={{
                  width: '100%', padding: '11px 14px', border: `1.5px solid ${vehicleNumber ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: "'Roboto Mono', monospace",
                  letterSpacing: '0.1em', outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
                  color: '#1e293b', transition: 'border-color 0.15s', marginBottom: 16,
                }}
              />
              <button
                type="submit"
                disabled={generating || !vehicleNumber.trim()}
                style={{
                  width: '100%', padding: '12px', background: generating || !vehicleNumber.trim() ? '#93c5fd' : '#2563eb',
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: generating || !vehicleNumber.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
                }}
              >
                {generating
                  ? <><i className="ri-loader-4-line vr-spin" /> Generating Report…</>
                  : <><i className="ri-file-add-line" /> Generate Report</>}
              </button>
            </form>

            {generateError && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <i className="ri-error-warning-line" style={{ flexShrink: 0, marginTop: 1 }} />{generateError}
              </div>
            )}
            {generateSuccess && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-checkbox-circle-line" />{generateSuccess}
              </div>
            )}

            {/* What's included */}
            <div style={{ marginTop: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>What's included</div>
              {[
                ['ri-id-card-line', 'Registration & owner details', '#3b82f6'],
                ['ri-shield-check-line', 'Insurance, PUCC & fitness status', '#10b981'],
                ['ri-file-warning-line', 'Pending & disposed challans', '#f59e0b'],
                ['ri-bar-chart-line', 'Vehicle health score & grade', '#8b5cf6'],
              ].map(([icon, text, color]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 12, color: '#475569' }}>
                  <i className={icon} style={{ color, fontSize: 14, flexShrink: 0 }} />{text}
                </div>
              ))}
            </div>

            {/* Expiry note */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
              <i className="ri-time-line" style={{ flexShrink: 0 }} />
              Reports are stored for <strong style={{ margin: '0 3px' }}>30 days</strong> and then archived.
            </div>

            {limit > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, color: '#1d4ed8' }}>
                <i className="ri-bar-chart-fill" style={{ flexShrink: 0 }} />
                <span><strong>{usedCount}</strong> of <strong>{limit}</strong> reports used{usedCount >= limit ? ' — limit reached' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Report History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: 'ri-file-list-3-line', val: usedCount, lbl: 'Total Reports', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
              { icon: 'ri-checkbox-circle-line', val: activeCount, lbl: 'Active', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
              { icon: 'ri-time-line', val: expiredCount, lbl: 'Expired', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
            ].map(({ icon, val, lbl, color, bg, border }) => (
              <div key={lbl} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className={icon} style={{ fontSize: 22, color }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Report list */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Report History</span>
              <button onClick={fetchList} disabled={loadingList} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`ri-refresh-line${loadingList ? ' vr-spin' : ''}`} /> Refresh
              </button>
            </div>

            {listError && (
              <div style={{ margin: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>{listError}</div>
            )}

            {loadingList ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
                <i className="ri-loader-4-line vr-spin" style={{ fontSize: 28 }} />
                <div style={{ marginTop: 8, fontSize: 13 }}>Loading reports…</div>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding: '52px 24px', textAlign: 'center', color: '#94a3b8' }}>
                <i className="ri-file-search-line" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>No reports yet</div>
                <div style={{ fontSize: 13 }}>Enter a vehicle number on the left to generate your first report.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    {['Vehicle', 'Data', 'Generated', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => {
                    const isExpired = report.status === 'expired';
                    const isViewing = viewingId === report.id;
                    const isDownloading = downloadingId === report.id;
                    const busy = isViewing || isDownloading;
                    return (
                      <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc', opacity: isExpired ? 0.7 : 1 }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: isExpired ? '#f1f5f9' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="ri-file-text-line" style={{ color: isExpired ? '#94a3b8' : '#2563eb', fontSize: 16 }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', letterSpacing: '0.04em', fontFamily: "'Roboto Mono', monospace" }}>{report.vehicle_number}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <DataBadge status={report.rto_status} label="RTO" />
                            <DataBadge status={report.challan_status} label="Challan" />
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>{formatDate(report.generated_at)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: isExpired ? '#94a3b8' : '#475569' }}>{formatDate(report.expires_at)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isExpired ? '#f1f5f9' : '#dcfce7', color: isExpired ? '#64748b' : '#15803d', border: `1px solid ${isExpired ? '#e2e8f0' : '#bbf7d0'}` }}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleViewReport(report.id)}
                              disabled={busy}
                              title="View report"
                              style={{ padding: '5px 12px', background: busy ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                            >
                              {isViewing ? <><i className="ri-loader-4-line vr-spin" /> …</> : <><i className="ri-eye-line" /> View</>}
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(report.id, report.vehicle_number)}
                              disabled={busy}
                              title="Download PDF"
                              style={{ padding: '5px 12px', background: busy ? '#f1f5f9' : '#f0fdf4', color: busy ? '#94a3b8' : '#15803d', border: `1.5px solid ${busy ? '#e2e8f0' : '#bbf7d0'}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                            >
                              {isDownloading ? <><i className="ri-loader-4-line vr-spin" /> PDF…</> : <><i className="ri-download-line" /> PDF</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Legend */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Data Status Legend</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {[
                { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', icon: 'ri-checkbox-circle-fill', label: 'Success', desc: 'Data fetched successfully' },
                { bg: '#fef3c7', color: '#92400e', border: '#fde68a', icon: 'ri-information-line', label: 'No Challans', desc: 'Clean challan record' },
                { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', icon: 'ri-close-circle-line', label: 'Failed', desc: 'Could not fetch data' },
              ].map(({ bg, color, border, icon, label, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: bg, borderRadius: 8, border: `1px solid ${border}` }}>
                  <i className={icon} style={{ color, fontSize: 16, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
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
      <i className={icon} />{label}
    </span>
  );
}
