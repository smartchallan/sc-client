import React, { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import { getTrialRestrictions } from '../utils/trialGuard';

const API = import.meta.env.VITE_API_BASE_URL;

function getClientId() {
  try {
    const u = JSON.parse(localStorage.getItem('sc_user'));
    return u?.user?.client_id || u?.user?.id || u?.user?._id || '';
  } catch { return ''; }
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

// Converts an Excel cell value (serial number or string) to YYYY-MM-DD.
// xlsx without cellDates returns date-formatted cells as serial numbers (integers).
function excelDobToISO(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'number') {
    // Excel serial date: days since 1899-12-30 (UTC), offset 25569 aligns to Unix epoch
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const dt = new Date(ms);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  // DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2,'0')}-${ddmmyyyy[1].padStart(2,'0')}`;
  return s; // already YYYY-MM-DD or pass through
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

  // Table controls
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | verified | pending
  const [filterDlStatus, setFilterDlStatus] = useState('all'); // all | ACTIVE | OTHER
  const [filterVehicleClass, setFilterVehicleClass] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [showBulk, setShowBulk] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkMsg, setBulkMsg] = useState(null); // { type, text, failed: [{dlNo, dob, reason}] }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(dldetobj, overrideLicenseNo, overrideDob)),
      });
    } catch {}
  };

  const savePending = async (dlNo, rowDob) => {
    try {
      await fetch(`${API}/savedrivedata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(
        `${API}/deletedriver/${id}?client_id=${encodeURIComponent(getClientId())}`,
        { method: 'PATCH' }
      );
      if (res.ok) {
        if (selectedDriverId === id) { setResult(null); setSelectedDriverId(null); }
        await fetchDrivers();
      }
    } catch {}
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  // All unique vehicle class abbreviations across all drivers
  const allVehicleClasses = [...new Set(
    drivers.flatMap(dr => (Array.isArray(dr.details?.vehicleClasses) ? dr.details.vehicleClasses.map(c => c.covabbrv).filter(Boolean) : []))
  )].sort();

  // Derived: filtered + sorted drivers
  const visibleDrivers = (() => {
    const q = search.trim().toLowerCase();
    let list = drivers.filter(dr => {
      const det = dr.details || {};
      if (filterStatus !== 'all' && dr.status !== filterStatus) return false;
      if (filterDlStatus !== 'all') {
        const dlSt = (det.status || '').toUpperCase();
        if (filterDlStatus === 'ACTIVE' && dlSt !== 'ACTIVE') return false;
        if (filterDlStatus === 'OTHER' && dlSt === 'ACTIVE') return false;
      }
      if (filterVehicleClass !== 'all') {
        const classes = Array.isArray(det.vehicleClasses) ? det.vehicleClasses.map(c => c.covabbrv) : [];
        if (!classes.includes(filterVehicleClass)) return false;
      }
      if (!q) return true;
      return (
        (dr.license_no || '').toLowerCase().includes(q) ||
        (det.name || '').toLowerCase().includes(q) ||
        (det.gender || '').toLowerCase().includes(q) ||
        (det.bloodGroup || '').toLowerCase().includes(q) ||
        (Array.isArray(det.vehicleClasses) ? det.vehicleClasses.map(c => c.covabbrv).join(' ') : '').toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      let av, bv;
      const da = a.details || {}, db = b.details || {};
      if (sortKey === 'name')           { av = da.name || ''; bv = db.name || ''; }
      else if (sortKey === 'license_no'){ av = a.license_no || ''; bv = b.license_no || ''; }
      else if (sortKey === 'dob')       { av = a.dob || ''; bv = b.dob || ''; }
      else if (sortKey === 'status')    { av = da.status || ''; bv = db.status || ''; }
      else if (sortKey === 'ntValidTill'){ av = da.ntValidTill || ''; bv = db.ntValidTill || ''; }
      else if (sortKey === 'trValidTill'){ av = da.trValidTill || ''; bv = db.trValidTill || ''; }
      else                              { av = a.created_at || ''; bv = b.created_at || ''; }
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  })();

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const downloadDriversExcel = () => {
    if (trial.download) { alert('Downloads are not available on a trial account. Please upgrade to export data.'); return; }
    const rows = [
      ['#', 'License No.', 'Name', 'DOB', 'Gender', 'Blood Group', 'DL Status', 'NT Valid Till', 'TR Valid Till', 'Vehicle Classes', 'Record Status', 'Saved On'],
      ...visibleDrivers.map((dr, idx) => {
        const det = dr.details || {};
        return [
          idx + 1,
          dr.license_no || '',
          det.name || '',
          fmtDate(dr.dob),
          det.gender || '',
          det.bloodGroup || '',
          det.status || '',
          det.ntValidTill || '',
          det.trValidTill || '',
          Array.isArray(det.vehicleClasses) ? det.vehicleClasses.map(c => c.covabbrv).filter(Boolean).join(', ') : '',
          dr.status === 'verified' ? 'Verified' : 'Pending',
          fmtDate(dr.created_at),
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [4, 18, 22, 12, 10, 12, 12, 14, 14, 20, 12, 14].map(wch => ({ wch }));
    const wb2 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2, ws, 'Registered Drivers');
    XLSX.writeFile(wb2, 'Registered_Drivers.xlsx');
  };

  const printDriversTable = () => {
    if (trial.print) { alert('Printing is not available on a trial account. Please upgrade to print.'); return; }
    const rows = visibleDrivers.map((dr, idx) => {
      const det = dr.details || {};
      const vc = Array.isArray(det.vehicleClasses) ? det.vehicleClasses.map(c => c.covabbrv).filter(Boolean).join(', ') : '—';
      return `<tr>
        <td>${idx + 1}</td><td>${dr.license_no || '—'}</td><td>${det.name || '—'}</td>
        <td>${fmtDate(dr.dob)}</td><td>${det.gender || '—'}</td><td>${det.bloodGroup || '—'}</td>
        <td>${det.status || '—'}</td><td>${det.ntValidTill || '—'}</td><td>${det.trValidTill || '—'}</td>
        <td>${vc}</td><td>${dr.status === 'verified' ? 'Verified' : 'Pending'}</td><td>${fmtDate(dr.created_at)}</td>
      </tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Registered Drivers</title>
      <style>
        body { font-family: sans-serif; font-size: 11px; padding: 16px; }
        h2 { font-size: 15px; margin-bottom: 4px; }
        p { color: #64748b; margin: 0 0 12px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a8a; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h2>Registered Drivers</h2>
      <p>Exported on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;|&nbsp; ${visibleDrivers.length} record(s)</p>
      <table>
        <thead><tr>
          <th>#</th><th>License No.</th><th>Name</th><th>DOB</th><th>Gender</th>
          <th>Blood Group</th><th>DL Status</th><th>NT Valid Till</th><th>TR Valid Till</th>
          <th>Vehicle Classes</th><th>Record Status</th><th>Saved On</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>`);
    win.document.close();
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <i className="ri-arrow-up-down-line" style={{ opacity: 0.3, marginLeft: 4, fontSize: 11 }} />;
    return <i className={`ri-arrow-${sortDir === 'asc' ? 'up' : 'down'}-line`} style={{ marginLeft: 4, fontSize: 11, color: '#2563eb' }} />;
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
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true });
      const [header, ...records] = rows;
      const h = (header || []).map(v => String(v ?? '').trim());
      if (!/s.*no/i.test(h[0]) || !/dl.*no/i.test(h[1]) || !/dob/i.test(h[2])) {
        throw new Error('Columns must be: S. No., DL No., DOB');
      }
      const bulkCap = trial.bulkLimit < Infinity ? trial.bulkLimit : 100;
      const valid = records.filter(r => r[1] && r[2]).slice(0, bulkCap);
      if (!valid.length) throw new Error('No valid records found');
      let ok = 0;
      const failedRows = []; // { sno, dlNo, dob, reason }
      for (let i = 0; i < valid.length; i++) {
        setBulkProgress(Math.round(((i + 1) / valid.length) * 100));
        const sno = valid[i][0] ?? (i + 1);
        const dlNo = String(valid[i][1]).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rowDob = excelDobToISO(valid[i][2]);
        try {
          const res = await fetch(`${API}/getdriverdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId: dlNo, dob: rowDob }),
          });
          if (res.ok) {
            const data = await res.json();
            const dldetobj = data?.response?.[0]?.response?.dldetobj?.[0];
            if (dldetobj) {
              await saveToDb(dldetobj, dlNo, rowDob);
              ok++;
            } else {
              await savePending(dlNo, rowDob);
              failedRows.push({ sno, dlNo, dob: rowDob, reason: 'No DL data returned' });
            }
          } else {
            let reason = 'API error';
            try { const e = await res.json(); reason = e.message || e.error || reason; } catch {}
            await savePending(dlNo, rowDob);
            failedRows.push({ sno, dlNo, dob: rowDob, reason });
          }
        } catch (err) {
          await savePending(dlNo, rowDob);
          failedRows.push({ sno, dlNo, dob: rowDob, reason: err.message || 'Network error' });
        }
      }
      setBulkMsg({ type: failedRows.length ? 'partial' : 'success', ok, failed: failedRows });
      await fetchDrivers();
    } catch (err) {
      setBulkMsg({ type: 'error', text: err.message || 'Bulk upload failed' });
    } finally {
      setBulkLoading(false);
      e.target.value = '';
    }
  };

  const trial = getTrialRestrictions();

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
        .dl-th-sort { cursor: pointer; user-select: none; white-space: nowrap; }
        .dl-th-sort:hover { color: #2563eb; }
        .dl-delete-btn {
          padding: 3px 8px; border: 1.5px solid #fecaca; border-radius: 6px;
          background: #fff; color: #dc2626; font-size: 12px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 4px; font-family: inherit;
          transition: background 0.12s;
        }
        .dl-delete-btn:hover { background: #fef2f2; }
        .dl-confirm-row td { background: #fff7ed !important; }
      `}</style>

      <p className="page-subtitle">Verify driving licenses and track driver information.</p>

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
                      Upload an Excel file with columns: <strong>S. No.</strong>, <strong>DL No.</strong>, <strong>DOB</strong>{' '}
                      (max {trial.bulkLimit < Infinity ? <><strong style={{ color: '#92400e' }}>{trial.bulkLimit} rows — trial limit</strong></> : '100 rows'}).
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
                    <div style={{ marginTop: 10 }}>
                      {/* Summary pill */}
                      <div style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        background: bulkMsg.type === 'error' ? '#fef2f2' : bulkMsg.type === 'partial' ? '#fff7ed' : '#f0fdf4',
                        color: bulkMsg.type === 'error' ? '#dc2626' : bulkMsg.type === 'partial' ? '#92400e' : '#15803d',
                        border: `1px solid ${bulkMsg.type === 'error' ? '#fecaca' : bulkMsg.type === 'partial' ? '#fed7aa' : '#bbf7d0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
                      }}>
                        {bulkMsg.type === 'error'
                          ? <span><i className="ri-error-warning-line" /> {bulkMsg.text || 'Bulk upload failed'}</span>
                          : <span>
                              <i className={bulkMsg.type === 'partial' ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} />
                              {' '}Done — <strong style={{ color: '#15803d' }}>{bulkMsg.ok} succeeded</strong>
                              {bulkMsg.failed?.length > 0 && <>, <strong style={{ color: '#dc2626' }}>{bulkMsg.failed.length} failed</strong></>}
                            </span>}
                        {bulkMsg.failed?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const rows = [['S. No.', 'DL No.', 'DOB', 'Reason'], ...bulkMsg.failed.map(r => [r.sno, r.dlNo, r.dob, r.reason])];
                              const ws = XLSX.utils.aoa_to_sheet(rows);
                              ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 14 }, { wch: 40 }];
                              const wb2 = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(wb2, ws, 'Failed Records');
                              XLSX.writeFile(wb2, 'DL_Bulk_Failed.xlsx');
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              borderRadius: 6, border: '1.5px solid #fca5a5', background: '#fff',
                              color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            <i className="ri-download-2-line" /> Download failed ({bulkMsg.failed.length})
                          </button>
                        )}
                      </div>
                      {/* Failed rows preview (max 5) */}
                      {bulkMsg.failed?.length > 0 && (
                        <div style={{ marginTop: 8, border: '1px solid #fed7aa', borderRadius: 8, overflow: 'hidden', fontSize: 12 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#fff7ed' }}>
                                {['#', 'DL No.', 'DOB', 'Reason'].map(h => (
                                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#92400e', fontWeight: 700, borderBottom: '1px solid #fed7aa' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {bulkMsg.failed.slice(0, 5).map((r, i) => (
                                <tr key={i} style={{ background: i % 2 ? '#fffbf7' : '#fff' }}>
                                  <td style={{ padding: '4px 8px', color: '#64748b' }}>{r.sno}</td>
                                  <td style={{ padding: '4px 8px', fontWeight: 600, color: '#1e293b' }}>{r.dlNo}</td>
                                  <td style={{ padding: '4px 8px', color: '#64748b' }}>{r.dob}</td>
                                  <td style={{ padding: '4px 8px', color: '#dc2626' }}>{r.reason}</td>
                                </tr>
                              ))}
                              {bulkMsg.failed.length > 5 && (
                                <tr>
                                  <td colSpan={4} style={{ padding: '4px 8px', color: '#94a3b8', textAlign: 'center' }}>
                                    +{bulkMsg.failed.length - 5} more — download for full list
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
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

      {/* ── Stats ── */}
      {!fetchingDrivers && drivers.length > 0 && (() => {
        const total     = drivers.length;
        const verified  = drivers.filter(d => d.status === 'verified').length;
        const pending   = drivers.filter(d => d.status === 'pending').length;
        const active    = drivers.filter(d => (d.details?.status || '').toUpperCase() === 'ACTIVE').length;
        const inactive  = verified - active;
        const stats = [
          { label: 'Total',    value: total,    icon: 'ri-id-card-line',        bg: '#eff6ff', color: '#2563eb' },
          { label: 'Verified', value: verified, icon: 'ri-shield-check-line',   bg: '#f0fdf4', color: '#15803d' },
          { label: 'Pending',  value: pending,  icon: 'ri-time-line',           bg: '#fefce8', color: '#92400e' },
          { label: 'DL Active',   value: active,   icon: 'ri-checkbox-circle-line', bg: '#f0fdf4', color: '#15803d' },
          { label: 'DL Inactive', value: inactive, icon: 'ri-close-circle-line',    bg: '#fef2f2', color: '#dc2626' },
        ];
        return (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {stats.map(s => (
              <div key={s.label} style={{
                flex: '1 1 120px', background: s.bg, borderRadius: 10,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                border: `1px solid ${s.color}22`,
              }}>
                <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Registered Drivers Table ── */}
      <div className="vst-card">
        {/* Card header */}
        <div className="vst-header">
          <div className="vst-header__left">
            <span className="vst-header__icon-box">
              <i className="ri-id-card-line" />
            </span>
            <div>
              <h2 className="vst-header__title">Registered Drivers</h2>
              <span className="vst-header__count">
                {visibleDrivers.length !== drivers.length
                  ? `${visibleDrivers.length} of ${drivers.length} drivers`
                  : `${drivers.length} drivers`}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: search + filters + actions — same pattern as fleet page */}
        {drivers.length > 0 && (
          <div className="vst-toolbar">
            <div className="vst-toolbar__left" style={{ flexWrap: 'nowrap' }}>
              {/* Search */}
              <div className="vst-search-wrap" style={{ width: 180, flexShrink: 0 }}>
                <i className="ri-search-line vst-search-wrap__icon" />
                <input
                  className="vst-search-input"
                  style={{ width: '100%' }}
                  placeholder="Search name, license…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Record status */}
              <select
                className={`vst-filter-trigger${filterStatus !== 'all' ? ' vst-filter-trigger--active' : ''}`}
                style={{ width: 'auto', flexShrink: 0 }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">Record: All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>

              {/* DL status */}
              <select
                className={`vst-filter-trigger${filterDlStatus !== 'all' ? ' vst-filter-trigger--active' : ''}`}
                style={{ width: 'auto', flexShrink: 0 }}
                value={filterDlStatus}
                onChange={e => setFilterDlStatus(e.target.value)}
              >
                <option value="all">DL Status: All</option>
                <option value="ACTIVE">DL Active</option>
                <option value="OTHER">DL Inactive</option>
              </select>

              {/* Vehicle class */}
              {allVehicleClasses.length > 0 && (
                <select
                  className={`vst-filter-trigger${filterVehicleClass !== 'all' ? ' vst-filter-trigger--active' : ''}`}
                  style={{ width: 'auto', flexShrink: 0 }}
                  value={filterVehicleClass}
                  onChange={e => setFilterVehicleClass(e.target.value)}
                >
                  <option value="all">Class: All</option>
                  {allVehicleClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              )}

              {/* Clear filters */}
              {(search || filterStatus !== 'all' || filterDlStatus !== 'all' || filterVehicleClass !== 'all') && (
                <button
                  type="button"
                  className="vst-filter-trigger"
                  onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDlStatus('all'); setFilterVehicleClass('all'); }}
                >
                  <i className="ri-close-circle-line vst-filter-trigger__icon" /> Clear
                </button>
              )}
            </div>

            <div className="vst-toolbar__right">
              <button type="button" className="vst-action-btn vst-action-btn--download" title="Download Excel" onClick={downloadDriversExcel}>
                <i className="ri-download-cloud-2-line" />
                <span>Excel</span>
              </button>
              <button type="button" className="vst-action-btn vst-action-btn--print" title="Print Table" onClick={printDriversTable}>
                <i className="ri-printer-line" />
                <span>Print</span>
              </button>
            </div>
          </div>
        )}

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
        ) : visibleDrivers.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <i className="ri-filter-off-line" style={{ fontSize: 36, color: '#cbd5e1', display: 'block', marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: '#94a3b8' }}>No records match the current filters.</div>
          </div>
        ) : (
          <div className="vst-table-wrap">
            <table className="vst-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="dl-th-sort" onClick={() => toggleSort('license_no')}>
                    License No. <SortIcon col="license_no" />
                  </th>
                  <th className="dl-th-sort" onClick={() => toggleSort('name')}>
                    Name <SortIcon col="name" />
                  </th>
                  <th className="dl-th-sort" onClick={() => toggleSort('dob')}>
                    DOB <SortIcon col="dob" />
                  </th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th className="dl-th-sort" onClick={() => toggleSort('status')}>
                    DL Status <SortIcon col="status" />
                  </th>
                  <th className="dl-th-sort" onClick={() => toggleSort('ntValidTill')}>
                    NT Valid Till <SortIcon col="ntValidTill" />
                  </th>
                  <th className="dl-th-sort" onClick={() => toggleSort('trValidTill')}>
                    TR Valid Till <SortIcon col="trValidTill" />
                  </th>
                  <th>Vehicle Classes</th>
                  <th>Record Status</th>
                  <th className="dl-th-sort" onClick={() => toggleSort('created_at')}>
                    Saved On <SortIcon col="created_at" />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleDrivers.map((dr, idx) => {
                  const det = dr.details || {};
                  const hasDetails = !!det.rawDetails;
                  const isSelected = selectedDriverId === dr.id;
                  const isConfirming = confirmDeleteId === dr.id;
                  const isDeleting = deletingId === dr.id;
                  return (
                    <tr
                      key={dr.id || idx}
                      className={`dl-table-row${hasDetails ? ' dl-table-row--clickable' : ''}${isSelected ? ' dl-table-row--selected' : ''}${isConfirming ? ' dl-confirm-row' : ''}`}
                      onClick={() => !isConfirming && hasDetails && handleRowClick(dr)}
                      title={!isConfirming && hasDetails ? 'Click to view details' : undefined}
                    >
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>{dr.license_no || '—'}</td>
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
                      <td style={{ fontSize: 12, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                        {Array.isArray(det.vehicleClasses) && det.vehicleClasses.length > 0
                          ? det.vehicleClasses.map(c => c.covabbrv).filter(Boolean).join(', ')
                          : '—'}
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
                      <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(dr.created_at)}</td>
                      <td style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>Delete?</span>
                            <button
                              className="dl-delete-btn"
                              style={{ borderColor: '#fca5a5', background: '#fee2e2' }}
                              onClick={() => handleDelete(dr.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? <i className="ri-loader-4-line dl-spin" /> : 'Yes'}
                            </button>
                            <button
                              className="dl-delete-btn"
                              style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="dl-delete-btn"
                            onClick={() => setConfirmDeleteId(dr.id)}
                            title="Delete record"
                          >
                            <i className="ri-delete-bin-6-line" />
                          </button>
                        )}
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
