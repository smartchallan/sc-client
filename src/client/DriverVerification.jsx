import React, { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_BASE_URL;

function getClientId() {
  try {
    const u = JSON.parse(localStorage.getItem('sc_user'));
    return u?.user?.client_id || u?.user?.id || u?.user?._id || '';
  } catch { return ''; }
}

function getToken() {
  return localStorage.getItem('sc_token') || '';
}

function clean(str) {
  return str?.trim() || '';
}

function fmtDate(dateStr) {
  if (!dateStr || dateStr === '-') return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusPill({ status }) {
  const isActive = status?.toUpperCase() === 'ACTIVE';
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#15803d' : '#dc2626',
      whiteSpace: 'nowrap',
    }}>
      {status || 'Unknown'}
    </span>
  );
}

export default function DriverVerification() {
  const [licenseNo, setLicenseNo] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { dldetobj, photo }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [drivers, setDrivers] = useState([]);
  const [fetchingDrivers, setFetchingDrivers] = useState(true);

  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const resultRef = useRef(null);

  const [showBulk, setShowBulk] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkMsg, setBulkMsg] = useState(null);

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    setFetchingDrivers(true);
    try {
      const clientId = getClientId();
      if (!clientId) return;
      const res = await fetch(`${API}/fetchdriver?client_id=${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(Array.isArray(data.drivers) ? data.drivers : Array.isArray(data) ? data : []);
      }
    } catch {}
    finally { setFetchingDrivers(false); }
  };

  const buildPayload = (dldetobj, overrideLicenseNo, overrideDob) => ({
    client_id: getClientId(),
    licenseNo: clean(dldetobj.dlobj?.dlLicno) || overrideLicenseNo || licenseNo,
    dob: overrideDob || dob,
    status: 'verified',
    details: {
      name: clean(dldetobj.bioObj?.bioFullName),
      fatherName: clean(dldetobj.bioObj?.bioSwdFullName),
      gender: clean(dldetobj.bioObj?.bioGenderDesc),
      bloodGroup: clean(dldetobj.bioObj?.bioBloodGroup),
      status: dldetobj.dlobj?.dlStatus || '',
      issueDate: dldetobj.dlobj?.dlIssuedt || '',
      ntValidTill: dldetobj.dlobj?.dlNtValdtoDt || '',
      trValidTill: dldetobj.dlobj?.dlTrValdtoDt || '',
      vehicleClasses: dldetobj.dlcovs || [],
      photo: dldetobj.bioImgObj?.biPhoto || dldetobj.bioObj?.biPhoto || '',
      address: {
        permanent: [
          dldetobj.bioObj?.bioPermAdd1, dldetobj.bioObj?.bioPermAdd2,
          dldetobj.bioObj?.bioPermAdd3, dldetobj.bioObj?.bioPermDistName, dldetobj.bioObj?.bioPermPin,
        ].map(clean).filter(Boolean).join(', '),
        temporary: [
          dldetobj.bioObj?.bioTempAdd1, dldetobj.bioObj?.bioTempAdd2,
          dldetobj.bioObj?.bioTempAdd3, dldetobj.bioObj?.bioTempDistName, dldetobj.bioObj?.bioTempPin,
        ].map(clean).filter(Boolean).join(', '),
      },
      rawDetails: dldetobj,
    },
  });

  const saveToDb = async (dldetobj, overrideLicenseNo, overrideDob) => {
    try {
      await fetch(`${API}/savedrivedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(buildPayload(dldetobj, overrideLicenseNo, overrideDob)),
      });
    } catch {}
  };

  const savePending = async (dlNo, rowDob) => {
    try {
      await fetch(`${API}/savedrivedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ client_id: getClientId(), licenseNo: dlNo, dob: rowDob, status: 'pending', details: null }),
      });
    } catch {}
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!licenseNo || !dob) { setError('Please enter both license number and date of birth.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    setSelectedDriverId(null);
    try {
      const res = await fetch(`${API}/getdriverdata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ driverId: licenseNo, dob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      const dldetobj = data?.response?.[0]?.response?.dldetobj?.[0];
      if (!dldetobj) throw new Error('Driver details not found in response');
      const photo = dldetobj.bioImgObj?.biPhoto || dldetobj.bioObj?.biPhoto || null;
      setResult({ dldetobj, photo });
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/savedrivedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(buildPayload(result.dldetobj)),
      });
      if (res.ok) { setSaved(true); await fetchDrivers(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleRowClick = (dr) => {
    const det = dr.details || {};
    if (!det.rawDetails) return; // pending record — no details to show
    setResult({ dldetobj: det.rawDetails, photo: det.photo || null });
    setSaved(true); // already persisted in DB
    setError('');
    setSelectedDriverId(dr.id);
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['S. No.', 'DL No.', 'DOB'],
      [1, 'GJ0420120005008', '1990-05-15']      
    ]);
    ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DL Upload');
    XLSX.writeFile(wb, 'DL_Bulk_Upload_Sample.xlsx');
  };

  const handleBulkFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkMsg(null);
    setBulkLoading(true);
    setBulkProgress(0);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      const [header, ...records] = rows;
      if (!/s.?no/i.test(header?.[0]) || !/dl.?no/i.test(header?.[1]) || !/dob/i.test(header?.[2])) {
        throw new Error('Columns must be: S. No., DL No., DOB');
      }
      const valid = records.filter(r => r[1] && r[2]).slice(0, 100);
      if (!valid.length) throw new Error('No valid records found');
      let ok = 0, fail = 0;
      for (let i = 0; i < valid.length; i++) {
        setBulkProgress(Math.round(((i + 1) / valid.length) * 100));
        const dlNo = String(valid[i][1]).trim();
        const rowDob = String(valid[i][2]).trim();
        try {
          const res = await fetch(`${API}/getdriverdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ driverId: dlNo, dob: rowDob }),
          });
          if (res.ok) {
            const data = await res.json();
            const dldetobj = data?.response?.[0]?.response?.dldetobj?.[0];
            if (dldetobj) {
              await saveToDb(dldetobj, dlNo, rowDob);
            } else {
              await savePending(dlNo, rowDob);
            }
            ok++;
          } else {
            await savePending(dlNo, rowDob);
            fail++;
          }
        } catch {
          await savePending(dlNo, rowDob);
          fail++;
        }
      }
      setBulkMsg({ type: 'success', text: `Done — Success: ${ok}, Failed: ${fail}` });
      await fetchDrivers();
    } catch (err) {
      setBulkMsg({ type: 'error', text: err.message || 'Bulk upload failed' });
    } finally {
      setBulkLoading(false);
      e.target.value = '';
    }
  };

  const dobMax = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0];
  const dobMin = new Date(new Date().setFullYear(new Date().getFullYear() - 80)).toISOString().split('T')[0];
  const d = result?.dldetobj;

  return (
    <>
      <style>{`
        @keyframes dl-spin { to { transform: rotate(360deg); } }
        .dl-spin { animation: dl-spin 0.8s linear infinite; display: inline-block; }
        .dl-field { padding: 9px 0; border-bottom: 1px solid #f1f5f9; }
        .dl-field:last-child { border-bottom: none; }
        .dl-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 2px; }
        .dl-value { font-size: 13.5px; font-weight: 500; color: #1e293b; }
        .dl-input {
          width: 100%; box-sizing: border-box; padding: 9px 12px;
          border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px;
          color: #1e293b; background: #f8fafc; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .dl-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background: #fff; }
        .dl-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .dl-input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }
        .dl-input[type="date"] { color-scheme: light; }
        .dl-btn-primary {
          padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          cursor: pointer; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff;
          display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; font-family: inherit;
        }
        .dl-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .dl-btn-ghost {
          padding: 7px 14px; border: 1.5px solid rgba(255,255,255,0.4); border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer; background: rgba(255,255,255,0.15);
          color: #fff; display: flex; align-items: center; gap: 6px;
          transition: background 0.15s; font-family: inherit; white-space: nowrap;
        }
        .dl-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.28); }
        .dl-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
        .dl-table-row:hover td { background: #f8fafc; }
        .dl-table-row--selected td { background: #eff6ff !important; }
        .dl-table-row--selected td:first-child { border-left: 3px solid #2563eb; }
        .dl-table-row--clickable { cursor: pointer; }
      `}</style>

      <p className="page-subtitle">Verify driving licenses against ULIP and track driver information.</p>

      {/* ── Top section: form + result ── */}
      <div ref={resultRef} style={{
        display: 'grid',
        gridTemplateColumns: d ? '360px 1fr' : '360px',
        gap: 20,
        marginBottom: 24,
        alignItems: 'start',
      }}>

        {/* Verify form card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'visible' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', padding: '15px 20px', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ri-search-eye-line" style={{ color: '#fff', fontSize: 18 }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Verify Driver License</span>
          </div>

          <div style={{ padding: 20 }}>
            <form onSubmit={handleVerify} autoComplete="off">
              {/* License number */}
              <div style={{ marginBottom: 16 }}>
                <label className="dl-label" style={{ display: 'block', marginBottom: 6 }}>License Number</label>
                <input
                  className="dl-input"
                  type="text"
                  value={licenseNo}
                  onChange={e => { setLicenseNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
                  placeholder="e.g. GJ0420120005008"
                  maxLength={16}
                  disabled={loading}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>State + Office code + Year + Serial</div>
              </div>

              {/* Date of birth — native input, no z-index issues */}
              <div style={{ marginBottom: 20 }}>
                <label className="dl-label" style={{ display: 'block', marginBottom: 6 }}>Date of Birth</label>
                <input
                  className="dl-input"
                  type="date"
                  value={dob}
                  onChange={e => { setDob(e.target.value); setError(''); }}
                  min={dobMin}
                  max={dobMax}
                  disabled={loading}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Must be 18–80 years old</div>
              </div>

              <button
                className="dl-btn-primary"
                type="submit"
                disabled={loading || !licenseNo || !dob}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading
                  ? <><i className="ri-loader-4-line dl-spin" />Fetching details…</>
                  : <><i className="ri-search-line" />Verify License</>}
              </button>

              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 8, fontSize: 13,
                  color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <i className="ri-error-warning-line" style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}
            </form>

            {/* Bulk section */}
            <div style={{ marginTop: 20, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowBulk(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 600, color: '#2563eb',
                  fontFamily: 'inherit',
                }}
              >
                <i className={`ri-arrow-${showBulk ? 'down' : 'right'}-s-line`} />
                <i className="ri-upload-2-line" />
                Bulk DL Verification
              </button>

              {showBulk && (
                <div style={{ marginTop: 12, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                      Upload an Excel file with columns: <strong>S. No.</strong>, <strong>DL No.</strong>, <strong>DOB</strong> (max 100 rows).
                    </div>
                    <button
                      type="button"
                      onClick={downloadSample}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        padding: '5px 10px', borderRadius: 6, border: '1.5px solid #2563eb',
                        background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <i className="ri-download-2-line" />
                      Sample
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkFile}
                    disabled={bulkLoading}
                    className="dl-input"
                    style={{ padding: '6px 10px', fontSize: 13 }}
                  />
                  {bulkLoading && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
                      <i className="ri-loader-4-line dl-spin" />
                      Processing… {bulkProgress}%
                      <div style={{ flex: 1, height: 4, background: '#dbeafe', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${bulkProgress}%`, background: '#2563eb', borderRadius: 4, transition: 'width 0.2s' }} />
                      </div>
                    </div>
                  )}
                  {bulkMsg && (
                    <div style={{
                      marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: bulkMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                      color: bulkMsg.type === 'error' ? '#dc2626' : '#15803d',
                      border: `1px solid ${bulkMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                    }}>
                      {bulkMsg.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Result card ── */}
        {d && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #065f46, #059669)',
              padding: '15px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ri-check-double-line" style={{ color: '#fff', fontSize: 20 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>License Verified</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{clean(d.dlobj?.dlLicno)}</div>
                </div>
              </div>
              <button className="dl-btn-ghost" onClick={handleManualSave} disabled={saving || saved}>
                {saving
                  ? <><i className="ri-loader-4-line dl-spin" />Saving…</>
                  : saved
                  ? <><i className="ri-check-line" />Saved</>
                  : <><i className="ri-save-3-line" />Save Driver</>}
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Profile */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                {result.photo ? (
                  <img
                    src={`data:image/jpeg;base64,${result.photo}`}
                    alt="Driver"
                    style={{ width: 80, height: 96, objectFit: 'cover', borderRadius: 8, border: '2px solid #e2e8f0', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 80, height: 96, borderRadius: 8, background: '#f1f5f9', border: '2px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 4, flexShrink: 0,
                  }}>
                    <i className="ri-user-line" style={{ fontSize: 28, color: '#cbd5e1' }} />
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>No Photo</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>
                    {clean(d.bioObj?.bioFullName) || 'N/A'}
                  </div>
                  {d.bioObj?.bioSwdFullName && (
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      S/O {clean(d.bioObj.bioSwdFullName)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <StatusPill status={d.dlobj?.dlStatus} />
                    {d.bioObj?.bioGenderDesc && (
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                        {clean(d.bioObj.bioGenderDesc)}
                      </span>
                    )}
                    {d.bioObj?.bioBloodGroup && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>
                        {d.bioObj.bioBloodGroup.trim()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
                {[
                  { label: 'License No', value: clean(d.dlobj?.dlLicno) },
                  { label: 'Date of Birth', value: clean(d.bioObj?.bioDob) },
                  { label: 'Issue Date', value: d.dlobj?.dlIssuedt },
                  { label: 'NT Valid Till', value: d.dlobj?.dlNtValdtoDt },
                  { label: 'TR Valid Till', value: d.dlobj?.dlTrValdtoDt },
                ].map(({ label, value }) => (
                  <div key={label} className="dl-field">
                    <div className="dl-label">{label}</div>
                    <div className="dl-value">{value || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Vehicle classes */}
              {d.dlcovs?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="dl-label" style={{ marginBottom: 6 }}>Vehicle Classes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {d.dlcovs.map((cov, i) => (
                      <span key={i} style={{
                        background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px',
                        borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid #dbeafe',
                      }}>
                        {cov.covabbrv}{cov.covdesc ? ` — ${cov.covdesc}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Address */}
              {d.bioObj?.bioPermAdd1 && (
                <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="dl-label" style={{ marginBottom: 4 }}>Permanent Address</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    {[d.bioObj?.bioPermAdd1, d.bioObj?.bioPermAdd2, d.bioObj?.bioPermAdd3, d.bioObj?.bioPermDistName, d.bioObj?.bioPermPin]
                      .map(clean).filter(Boolean).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Registered Drivers Table ── */}
      <div className="vst-card">
        <div className="vst-header">
          <div className="vst-header__left">
            <span className="vst-header__icon-box">
              <i className="ri-id-card-line" />
            </span>
            <div>
              <h2 className="vst-header__title">Registered Drivers</h2>
              <span className="vst-header__count">{drivers.length} drivers</span>
            </div>
          </div>
        </div>

        {fetchingDrivers ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            <i className="ri-loader-4-line dl-spin" style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
            Loading drivers…
          </div>
        ) : drivers.length === 0 ? (
          <div style={{ padding: '52px 24px', textAlign: 'center' }}>
            <i className="ri-id-card-line" style={{ fontSize: 44, color: '#cbd5e1', display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>No drivers registered yet</div>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>Verify a license above to get started.</div>
          </div>
        ) : (
          <div className="vst-table-wrap">
            <table className="vst-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>License No.</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>DL Status</th>
                  <th>NT Valid Till</th>
                  <th>TR Valid Till</th>
                  <th>Address</th>
                  <th>Record Status</th>
                  <th>Saved On</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((dr, idx) => {
                  const det = dr.details || {};
                  const hasDetails = !!det.rawDetails;
                  const isSelected = selectedDriverId === dr.id;
                  return (
                    <tr
                      key={dr.id || idx}
                      className={`dl-table-row${hasDetails ? ' dl-table-row--clickable' : ''}${isSelected ? ' dl-table-row--selected' : ''}`}
                      onClick={() => hasDetails && handleRowClick(dr)}
                      title={hasDetails ? 'Click to view details' : undefined}
                    >
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                        {dr.license_no || '—'}
                      </td>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{det.name || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(dr.dob)}</td>
                      <td>{det.gender || '—'}</td>
                      <td>
                        {det.bloodGroup
                          ? <span style={{ color: '#dc2626', fontWeight: 700 }}>{det.bloodGroup}</span>
                          : '—'}
                      </td>
                      <td><StatusPill status={det.status} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{det.ntValidTill || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{det.trValidTill || '—'}</td>
                      <td style={{
                        fontSize: 12, color: '#64748b',
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {det.address?.permanent || '—'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                          whiteSpace: 'nowrap',
                          background: dr.status === 'verified' ? '#dcfce7' : '#fef9c3',
                          color: dr.status === 'verified' ? '#15803d' : '#92400e',
                        }}>
                          {dr.status === 'verified' ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {fmtDate(dr.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
