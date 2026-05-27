/**
 * generateVehicleReportHTML
 * Builds a print-ready HTML string for the Vehicle History Report.
 * Handles partial data gracefully (RTO not available, no challans, etc.).
 */

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmt(val) {
  if (!val || val === 'NA' || val === 'N/A' || val === '—') return '—';
  return String(val);
}

function daysUntil(dateStr) {
  if (!dateStr || dateStr === '—') return null;
  const formats = [
    /(\d{2})-([A-Za-z]{3})-(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{2})-(\d{2})-(\d{4})/,
  ];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Math.ceil((d - Date.now()) / 86400000);
  return diff;
}

function expiryClass(days) {
  if (days === null) return 'neutral';
  if (days < 0) return 'expired';
  if (days <= 30) return 'warning';
  return 'valid';
}

function fmtDate(dateStr) {
  if (!dateStr || dateStr === 'NA') return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ownerSuffix(n) {
  const num = parseInt(n, 10);
  if (!num) return '—';
  if (num === 1) return '1st';
  if (num === 2) return '2nd';
  if (num === 3) return '3rd';
  return `${num}th`;
}

function calcHealthScore(vd, pendingCount) {
  let score = 100;
  const insur = daysUntil(vd.rc_insurance_upto);
  if (insur === null) score -= 20;
  else if (insur < 0) score -= 25;
  else if (insur <= 30) score -= 15;
  const pucc = daysUntil(vd.rc_pucc_upto);
  if (pucc === null) score -= 10;
  else if (pucc < 0) score -= 15;
  const fit = daysUntil(vd.rc_fit_upto);
  if (fit !== null && fit < 0) score -= 10;
  const ownerNum = parseInt(vd.rc_owner_sr, 10) || 1;
  if (ownerNum >= 5) score -= 15;
  else if (ownerNum >= 3) score -= 8;
  if (pendingCount > 0) score -= pendingCount * 8;
  const norms = (vd.rc_norms_desc || '').toUpperCase();
  if (norms.includes('I') || norms.includes('II') || norms.includes('III')) score -= 5;
  return Math.max(0, Math.min(100, score));
}

function grade(score) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function pct(days, totalDays = 365) {
  if (days === null) return 0;
  if (days <= 0) return 0;
  return Math.min(100, Math.round((days / totalDays) * 100));
}

// ── CSS (inlined) ─────────────────────────────────────────────────────────────

const CSS = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #1e293b; font-size: 13px; }
.page { width: 100%; min-height: 100vh; background: #fff; margin: 0 0 12px 0; position: relative; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); page-break-after: always; display: flex; flex-direction: column; }
@media print { @page { size: A4; margin: 0; } body { background: white; } .page { margin: 0; box-shadow: none; min-height: 1123px; } }

.hdr { background: linear-gradient(135deg, #0a2463 0%, #1565c0 55%, #1976d2 100%); padding: 12px 32px; display: flex; justify-content: space-between; align-items: center; color: white; }
.brand-logo { height: 36px; width: auto; background: white; border-radius: 5px; padding: 3px 8px; }
.hdr-meta { text-align: right; font-size: 11px; opacity: 0.85; }
.hdr-meta strong { font-size: 12px; display: block; font-weight: 700; }

.ftr { margin-top: auto; background: #f8fafc; border-top: 2px solid #e2e8f0; padding: 9px 32px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; }
.pg-num { background: #1565c0; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.sec-hdr { background: linear-gradient(90deg, #1565c0, #1976d2); color: white; padding: 11px 32px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; letter-spacing: 0.2px; }
.sec-hdr.danger { background: linear-gradient(90deg, #b71c1c, #e53935); }
.sec-hdr.warn { background: linear-gradient(90deg, #e65100, #f57c00); }

.hero { background: linear-gradient(150deg, #0a2463 0%, #1565c0 45%, #2196f3 100%); padding: 28px 32px 36px; color: white; position: relative; overflow: hidden; }
.hero::after { content:''; position:absolute; bottom:-80px; left:-60px; width:260px; height:260px; border-radius:50%; background:rgba(255,255,255,0.03); }
.report-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); border-radius:20px; padding:3px 12px; font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; }
.veh-name { font-size:28px; font-weight:900; line-height:1.1; letter-spacing:-0.5px; }
.veh-sub { font-size:12px; font-weight:500; opacity:0.82; margin: 5px 0 14px; }
.hero-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:5px; }
.reg-plate { display:inline-flex; align-items:center; gap:7px; background:#ff6f00; border-radius:7px; padding:6px 14px; font-weight:800; font-size:17px; letter-spacing:3px; box-shadow:0 4px 14px rgba(255,111,0,0.45); margin-bottom:16px; }
.owner-count-badge { display:flex; flex-direction:column; align-items:center; background:rgba(239,68,68,0.25); border:2px solid rgba(239,68,68,0.6); border-radius:10px; padding:8px 16px; text-align:center; }
.owner-count-num { font-size:26px; font-weight:900; color:#fca5a5; line-height:1; }
.owner-count-lbl { font-size:10px; opacity:0.8; text-transform:uppercase; letter-spacing:0.6px; margin-top:2px; }
.hero-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:9px; }
.hero-card { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.22); border-radius:11px; padding:11px; text-align:center; }
.hero-card.warn-card { background:rgba(239,68,68,0.2); border-color:rgba(239,68,68,0.5); }
.hero-card .ic { font-size:22px; margin-bottom:4px; }
.hero-card .val { font-size:12px; font-weight:700; }
.hero-card .val.red { color:#fca5a5; }
.hero-card .lbl { font-size:9px; opacity:0.72; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

.critical-banner { background:linear-gradient(135deg,#7f1d1d,#991b1b); color:white; padding:11px 32px; display:flex; align-items:center; gap:12px; }
.critical-banner .cb-icon { font-size:22px; flex-shrink:0; }
.critical-banner .cb-text { flex:1; }
.critical-banner .cb-text strong { font-size:12px; display:block; margin-bottom:2px; font-weight:700; }
.critical-banner .cb-text span { font-size:10px; opacity:0.85; }
.critical-banner .cb-tag { background:#ef4444; border-radius:5px; padding:4px 12px; font-size:10px; font-weight:700; white-space:nowrap; }

.score-wrap { padding:18px 32px; display:grid; grid-template-columns:170px 1fr; gap:18px; align-items:center; }
.score-card { background:linear-gradient(145deg,#1a237e,#283593); border-radius:14px; padding:20px 16px; color:white; text-align:center; box-shadow:0 8px 28px rgba(26,35,126,0.28); }
.score-ring { width:90px; height:90px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; position:relative; }
.score-inner { position:absolute; width:66px; height:66px; border-radius:50%; background:linear-gradient(145deg,#1a237e,#283593); display:flex; align-items:center; justify-content:center; }
.score-num { font-size:24px; font-weight:800; color:#fbbf24; }
.score-title { font-size:11px; font-weight:700; margin-bottom:3px; }
.score-sub { font-size:10px; opacity:0.65; line-height:1.5; }
.grade-chip { background:#fbbf24; color:#1a237e; border-radius:20px; padding:3px 14px; font-size:11px; font-weight:700; display:inline-block; margin-top:8px; }
.checks-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.chk { display:flex; align-items:center; gap:8px; background:#f8fafc; border-radius:9px; padding:8px 10px; border-left:4px solid #43a047; }
.chk.danger { border-left-color:#e53935; background:#fff5f5; }
.chk.warn { border-left-color:#ef6c00; background:#fffbf0; }
.chk .ci { font-size:16px; }
.chk-txt { flex:1; }
.chk-t { font-size:11px; font-weight:600; color:#1e293b; }
.chk-s { font-size:10px; color:#64748b; }
.chk-badge { font-size:9px; font-weight:700; padding:2px 7px; border-radius:20px; white-space:nowrap; }
.chk-badge.ok { background:#e8f5e9; color:#2e7d32; }
.chk-badge.warn { background:#fff3e0; color:#e65100; }
.chk-badge.red { background:#ffebee; color:#c62828; }

.verdict { margin:0 32px 14px; border-radius:11px; padding:13px 16px; border-left:5px solid; display:flex; align-items:center; gap:11px; }
.verdict.warn-v { background:linear-gradient(135deg,#fff8e1,#fffde7); border-color:#f59e0b; }
.verdict.ok-v { background:linear-gradient(135deg,#e8f5e9,#f1f8e9); border-color:#43a047; }
.verdict-icon { font-size:28px; }
.verdict h3 { font-size:12px; font-weight:700; margin-bottom:3px; }
.verdict.warn-v h3 { color:#78350f; }
.verdict.ok-v h3 { color:#1b5e20; }
.verdict p { font-size:10px; line-height:1.55; }
.verdict.warn-v p { color:#92400e; }
.verdict.ok-v p { color:#33691e; }

.metrics { background:#0d47a1; padding:12px 32px; display:flex; justify-content:space-around; }
.met { text-align:center; color:white; }
.met-v { font-size:15px; font-weight:700; }
.met-v.red { color:#fca5a5; }
.met-l { font-size:10px; opacity:0.72; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

.cs { padding:18px 32px; }

.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-bottom:16px; }
.icard { background:#f8fafc; border-radius:10px; padding:11px 13px; border:1px solid #e2e8f0; }
.icard-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.7px; color:#64748b; margin-bottom:4px; }
.icard-val { font-size:13px; font-weight:600; color:#1e293b; }
.icard-val.green { color:#2e7d32; }
.icard-val.blue { color:#1565c0; }
.icard-val.red { color:#c62828; }

.badge { display:inline-flex; align-items:center; gap:3px; padding:2px 9px; border-radius:20px; font-size:10px; font-weight:600; }
.badge-g { background:#e8f5e9; color:#2e7d32; }
.badge-r { background:#ffebee; color:#c62828; }
.badge-o { background:#fff3e0; color:#e65100; }
.badge-b { background:#e3f2fd; color:#1565c0; }

.owner-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; margin-bottom:16px; }
.os-card { border-radius:11px; padding:14px; text-align:center; border-top:4px solid; }
.os-card.blue { background:linear-gradient(135deg,#e3f2fd,#bbdefb); border-top-color:#1565c0; }
.os-card.orange { background:linear-gradient(135deg,#fff3e0,#ffe0b2); border-top-color:#ef6c00; }
.os-card.red { background:linear-gradient(135deg,#ffebee,#ffcdd2); border-top-color:#c62828; }
.os-icon { font-size:22px; margin-bottom:5px; }
.os-val { font-size:20px; font-weight:800; color:#1e293b; }
.os-lbl { font-size:10px; color:#546e7a; margin-top:2px; }

.oh-table { width:100%; border-collapse:collapse; border-radius:11px; overflow:hidden; border:1px solid #e2e8f0; }
.oh-table thead tr { background:linear-gradient(90deg,#1a237e,#1565c0); color:white; }
.oh-table thead th { padding:10px 12px; font-size:10px; font-weight:700; text-align:left; letter-spacing:0.4px; text-transform:uppercase; }
.oh-table tbody tr { border-bottom:1px solid #f1f5f9; }
.oh-table tbody tr.current-owner { background:linear-gradient(90deg,#e8f5e9,#f1f8e9); border-left:4px solid #2e7d32; }
.oh-table tbody tr.prev-owner:nth-child(even) { background:#f8fafc; }
.oh-table tbody td { padding:10px 12px; font-size:11px; vertical-align:middle; }
.owner-num { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; }
.on-1 { background:#e3f2fd; color:#1565c0; }
.on-2 { background:#f3e5f5; color:#7b1fa2; }
.on-3 { background:#fff3e0; color:#e65100; }
.on-4 { background:#fce4ec; color:#c2185b; }
.on-5 { background:#e8f5e9; color:#2e7d32; border:2px solid #4caf50; }
.on-def { background:#f1f5f9; color:#475569; }
.owner-name-text { font-weight:600; color:#1e293b; font-size:12px; }
.owner-type-lbl { font-size:10px; color:#64748b; margin-top:1px; }
.oh-status { display:inline-flex; align-items:center; gap:3px; padding:2px 9px; border-radius:20px; font-size:9px; font-weight:700; }
.oh-current { background:#e8f5e9; color:#2e7d32; }
.oh-previous { background:#f1f5f9; color:#64748b; }
.oh-dealer { background:#e3f2fd; color:#1565c0; }

.spec-grid8 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
.spec-card { border-radius:11px; padding:13px 10px; text-align:center; border-bottom:3px solid #1565c0; background:linear-gradient(135deg,#e3f2fd,#bbdefb); }
.spec-card.g { background:linear-gradient(135deg,#e8f5e9,#c8e6c9); border-bottom-color:#2e7d32; }
.spec-card.o { background:linear-gradient(135deg,#fff3e0,#ffe0b2); border-bottom-color:#ef6c00; }
.spec-card.p { background:linear-gradient(135deg,#f3e5f5,#e1bee7); border-bottom-color:#7b1fa2; }
.spec-ic { font-size:22px; margin-bottom:5px; }
.spec-lbl { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#546e7a; margin-bottom:2px; }
.spec-val { font-size:14px; font-weight:800; color:#1e293b; }
.spec-unit { font-size:9px; color:#64748b; }

.two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.stbl { background:white; border-radius:10px; border:1px solid #e2e8f0; overflow:hidden; margin-bottom:14px; }
.stbl-hdr { background:linear-gradient(90deg,#1565c0,#42a5f5); color:white; padding:9px 14px; font-size:12px; font-weight:700; display:flex; align-items:center; gap:7px; }
.srow { display:flex; justify-content:space-between; align-items:center; padding:7px 14px; border-bottom:1px solid #f1f5f9; }
.srow:last-child { border-bottom:none; }
.srow:nth-child(odd) { background:#f8fafc; }
.srow-lbl { font-size:11px; color:#64748b; }
.srow-val { font-size:11px; font-weight:600; color:#1e293b; }
.srow-val.red { color:#c62828; }

.comp-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; margin-bottom:16px; }
.comp-card { border-radius:11px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.07); }
.comp-hdr { padding:10px 12px; display:flex; align-items:center; gap:8px; font-weight:700; font-size:12px; color:white; }
.comp-hdr.active { background:linear-gradient(90deg,#2e7d32,#43a047); }
.comp-hdr.danger { background:linear-gradient(90deg,#b71c1c,#e53935); }
.comp-hdr.warn { background:linear-gradient(90deg,#e65100,#ef6c00); }
.comp-body { background:white; padding:11px 12px; border:1px solid #e2e8f0; border-top:none; }
.comp-ic { font-size:18px; }
.comp-status-lbl { font-size:9px; opacity:0.88; text-transform:uppercase; letter-spacing:0.5px; }
.comp-lbl { font-size:10px; color:#64748b; margin-bottom:2px; }
.comp-val { font-size:12px; font-weight:700; color:#1e293b; margin-bottom:5px; }
.comp-val.sm { font-size:10px; font-family:monospace; }
.comp-val.red { color:#c62828; }
.vbar { height:4px; background:#e2e8f0; border-radius:2px; overflow:hidden; margin-top:5px; }
.vbar-fill { height:100%; border-radius:2px; background:linear-gradient(90deg,#43a047,#66bb6a); }
.vbar-fill.red { background:linear-gradient(90deg,#e53935,#ef9a9a); }
.vbar-fill.orange { background:linear-gradient(90deg,#ef6c00,#ffa726); }
.vbar-days { font-size:9px; color:#94a3b8; margin-top:2px; }
.vbar-days.red { color:#c62828; font-weight:600; }

.challan-card { border-radius:11px; overflow:hidden; border:2px solid #e53935; box-shadow:0 4px 16px rgba(229,57,53,0.15); margin-bottom:12px; }
.challan-header { background:linear-gradient(90deg,#b71c1c,#e53935); color:white; padding:10px 16px; display:flex; justify-content:space-between; align-items:center; }
.challan-header-left h3 { font-size:13px; font-weight:800; }
.challan-header-left p { font-size:10px; opacity:0.85; margin-top:2px; }
.challan-status-pill { background:#ff8f00; border-radius:7px; padding:5px 12px; font-size:11px; font-weight:700; letter-spacing:0.5px; }
.challan-status-pill.disposed { background:#2e7d32; }
.challan-body { background:white; padding:14px 16px; }
.challan-meta { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:12px; }
.cm-label { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.6px; color:#64748b; margin-bottom:2px; }
.cm-value { font-size:12px; font-weight:600; color:#1e293b; }
.cm-value.red { color:#c62828; }
.offence-list { background:#fff5f5; border-radius:7px; padding:10px 12px; border-left:4px solid #e53935; }
.offence-list h4 { font-size:10px; font-weight:700; color:#7f1d1d; margin-bottom:7px; text-transform:uppercase; letter-spacing:0.4px; }
.offence-item { display:flex; gap:7px; margin-bottom:6px; align-items:flex-start; }
.offence-act { background:#c62828; color:white; font-size:9px; font-weight:700; padding:2px 7px; border-radius:4px; white-space:nowrap; flex-shrink:0; margin-top:1px; }
.offence-name { font-size:10px; color:#7f1d1d; line-height:1.5; }

.bl-banner { background:linear-gradient(135deg,#e8f5e9,#f1f8e9); border-radius:11px; padding:14px 18px; border:2px solid #4caf50; display:flex; align-items:center; gap:14px; margin-bottom:12px; }
.bl-ic { font-size:36px; }
.bl-text h3 { font-size:13px; font-weight:800; color:#1b5e20; margin-bottom:3px; }
.bl-text p { font-size:10px; color:#33691e; line-height:1.55; }
.bl-tag { background:#4caf50; color:white; padding:6px 14px; border-radius:7px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }

.alert { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:9px; margin-bottom:8px; }
.alert.success { background:#e8f5e9; border:1px solid #a5d6a7; }
.alert.warn { background:#fff8e1; border:1px solid #ffe082; }
.alert.danger { background:#ffebee; border:1px solid #ef9a9a; }
.alert.info { background:#e3f2fd; border:1px solid #90caf9; }
.alert-ic { font-size:16px; flex-shrink:0; }
.alert h4 { font-size:11px; font-weight:700; margin-bottom:2px; }
.alert p { font-size:10px; color:#546e7a; }

.fin-hero { background:linear-gradient(135deg,#1a237e,#283593); padding:22px 32px; color:white; display:flex; justify-content:space-between; align-items:center; }
.fin-amt { font-size:30px; font-weight:800; color:#fbbf24; }
.fin-lbl { font-size:11px; opacity:0.78; margin-bottom:4px; }
.fin-sub { font-size:10px; opacity:0.55; }

.big-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; margin-bottom:14px; }
.bstat { background:linear-gradient(135deg,#e3f2fd,#bbdefb); border-radius:11px; padding:14px; text-align:center; border-top:4px solid #1565c0; }
.bstat.y { background:linear-gradient(135deg,#fffde7,#fff9c4); border-top-color:#f59e0b; }
.bstat.r { background:linear-gradient(135deg,#ffebee,#ffcdd2); border-top-color:#c62828; }
.bstat-ic { font-size:22px; margin-bottom:4px; }
.bstat-val { font-size:20px; font-weight:800; color:#1e293b; }
.bstat-lbl { font-size:10px; color:#546e7a; margin-top:2px; }

.ibox { border-radius:10px; padding:12px 14px; margin-bottom:11px; display:flex; align-items:flex-start; gap:10px; }
.ibox-red { background:#ffebee; border-left:4px solid #c62828; }
.ibox-icon { font-size:22px; flex-shrink:0; }
.ibox h4 { font-size:11px; font-weight:700; margin-bottom:3px; }
.ibox p { font-size:10px; line-height:1.65; }

.gloss { background:#f8fafc; border-radius:11px; padding:14px; border:1px solid #e2e8f0; }
.gloss-title { font-size:12px; font-weight:700; color:#1565c0; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
.gloss-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.gloss-item { display:flex; gap:7px; font-size:10px; }
.gloss-term { font-weight:700; color:#1565c0; min-width:50px; }
.gloss-def { color:#64748b; }

.sdiv { display:flex; align-items:center; gap:9px; margin:12px 0 10px; }
.sdiv::before, .sdiv::after { content:''; flex:1; height:1px; background:#e2e8f0; }
.sdiv span { font-size:9px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; }

.disclaimer { font-size:9px; color:#94a3b8; line-height:1.65; padding:10px 32px; border-top:1px solid #f1f5f9; font-style:italic; }

.na-box { background:#f1f5f9; border:2px dashed #cbd5e1; border-radius:11px; padding:20px; text-align:center; color:#94a3b8; margin:10px 0; }
.na-box .na-ic { font-size:30px; margin-bottom:6px; }
.na-box .na-txt { font-size:12px; font-weight:600; margin-bottom:4px; }
.na-box .na-sub { font-size:10px; }
`;

// ── Section builders ──────────────────────────────────────────────────────────

function notAvailableBox(icon, title, subtitle) {
  return `<div class="na-box"><div class="na-ic">${icon}</div><div class="na-txt">${title}</div><div class="na-sub">${subtitle}</div></div>`;
}

function header(logoUrl, titleRight, dateStr) {
  const logoTag = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" class="brand-logo" />`
    : `<div style="font-size:18px;font-weight:900;color:white;letter-spacing:1px;">SMARTCHALLAN</div>`;
  return `<div class="hdr"><div class="brand">${logoTag}</div><div class="hdr-meta"><strong>${titleRight}</strong>${dateStr}</div></div>`;
}

function footer(page, total) {
  return `<div class="ftr"><div>© ${new Date().getFullYear()} SmartChallan · Powered by Maavin Technologies · Data Source: Vahan / RTO</div><div style="display:flex;align-items:center;gap:6px;"><span>Page</span><div class="pg-num">${page}</div><span>of ${total}</span></div></div>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateVehicleReportHTML({ vehicleNumber, rtoData, challanData, rtoStatus, challanStatus, generatedAt, expiresAt, logoUrl }) {
  const now = generatedAt ? new Date(generatedAt) : new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalPages = 5;

  // ── Extract RTO fields ────────────────────────────────────────────────────
  const hasRTO = rtoStatus === 'success' && rtoData;
  const vd = hasRTO
    ? (rtoData.VehicleDetails || rtoData.vehicleDetails || rtoData.VehicleDetails || rtoData || {})
    : {};

  const regNo = fmt(vd.rc_regn_no) !== '—' ? fmt(vd.rc_regn_no) : vehicleNumber;
  const ownerName = fmt(vd.rc_owner_name);
  const ownerSr = fmt(vd.rc_owner_sr);
  const ownerLabel = ownerSuffix(ownerSr !== '—' ? ownerSr : '1');
  const maker = fmt(vd.rc_maker_desc);
  const model = fmt(vd.rc_maker_model);
  const fuelType = fmt(vd.rc_fuel_desc);
  const color = fmt(vd.rc_color);
  const bodyType = fmt(vd.rc_body_type_desc);
  const vehicleClass = fmt(vd.rc_vh_class_desc);
  const normsDesc = fmt(vd.rc_norms_desc);
  const engineNo = fmt(vd.rc_eng_no);
  const chassisNo = fmt(vd.rc_chasi_no);
  const cylinders = fmt(vd.rc_no_cyl);
  const cubicCap = fmt(vd.rc_cubic_cap);
  const seatCap = fmt(vd.rc_seat_cap);
  const unldWt = fmt(vd.rc_unld_wt);
  const gvw = fmt(vd.rc_gvw);
  const financer = fmt(vd.rc_financer);
  const blacklist = fmt(vd.rc_blacklist_status);
  const rcStatus = fmt(vd.rc_status);
  const taxMode = fmt(vd.rc_tax_mode);
  const saleAmt = fmt(vd.rc_sale_amt);
  const regDate = fmtDate(vd.rc_regn_dt);
  const insuranceComp = fmt(vd.rc_insurance_comp);
  const insurancePolicyNo = fmt(vd.rc_insurance_policy_no);
  const insuranceUpto = fmtDate(vd.rc_insurance_upto);
  const puccNo = fmt(vd.rc_pucc_no);
  const puccUpto = fmtDate(vd.rc_pucc_upto);
  const fitUpto = fmtDate(vd.rc_fit_upto);
  const taxUpto = fmtDate(vd.rc_tax_upto);
  const registeredAt = fmt(vd.rc_registered_at || vd.rc_off_cd);
  const presentAddress = fmt(vd.rc_present_address);

  // Mfg year from reg date
  const mfgYear = vd.rc_regn_dt ? new Date(vd.rc_regn_dt).getFullYear() || '—' : '—';

  // ── Extract Challan fields ────────────────────────────────────────────────
  const hasChallan = (challanStatus === 'success' || challanStatus === 'no_challans') && challanData;
  const pendingArr = hasChallan ? (Array.isArray(challanData.Pending_data) ? challanData.Pending_data : (challanData.Pending_data ? [challanData.Pending_data] : [])) : [];
  const disposedArr = hasChallan ? (Array.isArray(challanData.Disposed_data) ? challanData.Disposed_data : (challanData.Disposed_data ? [challanData.Disposed_data] : [])) : [];
  const pendingCount = pendingArr.length;
  const disposedCount = disposedArr.length;
  const totalFine = pendingArr.reduce((s, c) => s + (parseFloat(c.fine_imposed) || 0), 0);

  // ── Health score ─────────────────────────────────────────────────────────
  const healthScore = hasRTO ? calcHealthScore(vd, pendingCount) : 0;
  const healthGrade = grade(healthScore);
  const scoreLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 65 ? 'Good' : healthScore >= 50 ? 'Needs Attention' : 'Poor';

  // ── Days calculations ─────────────────────────────────────────────────────
  const insurDays = daysUntil(vd.rc_insurance_upto);
  const puccDays = daysUntil(vd.rc_pucc_upto);
  const fitDays = daysUntil(vd.rc_fit_upto);
  const taxDays = daysUntil(vd.rc_tax_upto);

  const insurClass = expiryClass(insurDays);
  const puccClass = expiryClass(puccDays);

  // ── PAGE 1: Summary ──────────────────────────────────────────────────────
  const vehicleTitle = (maker !== '—' && model !== '—') ? `${maker} ${model}` : vehicleNumber;
  const vehicleSub = [fuelType, bodyType, mfgYear !== '—' ? String(mfgYear) : '', color].filter(v => v && v !== '—').join(' · ');

  const criticalBanner = insurClass === 'warning' && insurDays !== null
    ? `<div class="critical-banner"><div class="cb-icon">🚨</div><div class="cb-text"><strong>CRITICAL: Insurance Expires in ${insurDays} Days — Immediate Action Required</strong><span>${insuranceComp !== '—' ? insuranceComp : 'Insurance'} expires on ${insuranceUpto}. Driving without valid insurance is a legal offence under Motor Vehicles Act.</span></div><div class="cb-tag">⚠ ACT NOW</div></div>`
    : (insurClass === 'expired'
      ? `<div class="critical-banner"><div class="cb-icon">🚨</div><div class="cb-text"><strong>CRITICAL: Insurance Has Expired — Vehicle Not Insured</strong><span>Insurance expired on ${insuranceUpto}. Driving an uninsured vehicle is an offence under Section 146 of the Motor Vehicles Act.</span></div><div class="cb-tag">EXPIRED</div></div>`
      : '');

  const insurCardClass = insurClass === 'warning' || insurClass === 'expired' ? 'warn-card' : '';
  const insurCardVal = insurDays !== null ? (insurDays < 0 ? 'EXPIRED' : `${insurDays} DAYS`) : (insuranceUpto !== '—' ? insuranceUpto : 'N/A');
  const insurCardColor = insurClass !== 'valid' ? 'red' : '';

  const scoreRingBg = `conic-gradient(#fbbf24 0% ${healthScore}%, rgba(255,255,255,0.14) ${healthScore}% 100%)`;

  // Check items
  const rcOk = rcStatus && rcStatus !== '—' && rcStatus.toUpperCase() !== 'INACTIVE';
  const blOk = blacklist && (blacklist.toUpperCase() === 'NOT_BLACKLISTED' || blacklist.toUpperCase().includes('NOT') || blacklist === '—');
  const loanOk = !financer || financer === '—' || financer.toUpperCase() === 'NA' || financer.toUpperCase() === 'NONE';

  const page1 = `
<div class="page">
  ${header(logoUrl, `Report ID: SC-${regNo}-${now.getFullYear()}`, dateStr)}
  ${criticalBanner}
  <div class="hero">
    <div class="report-pill">🔍 &nbsp;Vehicle History Report</div>
    <div class="hero-top">
      <div>
        <div class="veh-name">${vehicleTitle}</div>
        <div class="veh-sub">${vehicleSub || 'Vehicle details from RTO database'}</div>
        <div class="reg-plate">🚗 &nbsp;${regNo}</div>
      </div>
      <div class="owner-count-badge">
        <div class="owner-count-num">${ownerLabel}</div>
        <div class="owner-count-lbl">Owner</div>
        <div style="font-size:9px;opacity:0.7;margin-top:3px;">${ownerSr !== '—' && parseInt(ownerSr) > 1 ? (parseInt(ownerSr)-1)+' prev. owners' : 'First owner'}</div>
      </div>
    </div>
    <div class="hero-grid">
      <div class="hero-card ${insurCardClass}"><div class="ic">🛡️</div><div class="val ${insurCardColor}">${insurCardVal}</div><div class="lbl">Insurance</div></div>
      <div class="hero-card"><div class="ic">✅</div><div class="val">${rcStatus !== '—' ? rcStatus : 'N/A'}</div><div class="lbl">RC Status</div></div>
      <div class="hero-card"><div class="ic">⛽</div><div class="val">${fuelType !== '—' ? fuelType.toUpperCase() : 'N/A'}</div><div class="lbl">Fuel Type</div></div>
      <div class="hero-card"><div class="ic">📅</div><div class="val">${mfgYear !== '—' ? mfgYear : 'N/A'}</div><div class="lbl">Mfg. Year</div></div>
    </div>
  </div>
  ${hasRTO ? `
  <div class="score-wrap">
    <div class="score-card">
      <div style="font-size:10px;opacity:0.65;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Vehicle Health Score</div>
      <div class="score-ring" style="background:${scoreRingBg};">
        <div class="score-inner"><div class="score-num">${healthScore}</div></div>
      </div>
      <div class="score-title">${scoreLabel}</div>
      <div class="score-sub">${insurClass !== 'valid' ? 'Insurance critical · ' : ''}${ownerSr !== '—' && parseInt(ownerSr) >= 3 ? ownerLabel+' owner · ' : ''}${normsDesc !== '—' ? normsDesc : ''}</div>
      <div class="grade-chip">Grade: ${healthGrade}</div>
    </div>
    <div class="checks-grid">
      <div class="chk ${insurClass === 'valid' ? '' : (insurClass === 'warning' ? 'warn' : 'danger')}"><div class="ci">🛡️</div><div class="chk-txt"><div class="chk-t">Insurance</div><div class="chk-s">Expires ${insuranceUpto}</div></div><div class="chk-badge ${insurClass === 'valid' ? 'ok' : (insurClass === 'warning' ? 'warn' : 'red')}">${insurClass === 'valid' ? 'VALID' : (insurClass === 'warning' ? 'EXPIRING' : 'EXPIRED')}</div></div>
      <div class="chk ${puccClass !== 'valid' ? 'warn' : ''}"><div class="ci">🌿</div><div class="chk-txt"><div class="chk-t">PUCC Certificate</div><div class="chk-s">Valid till ${puccUpto}</div></div><div class="chk-badge ${puccClass === 'valid' ? 'ok' : 'warn'}">${puccClass === 'valid' ? 'VALID' : 'CHECK'}</div></div>
      <div class="chk"><div class="ci">📋</div><div class="chk-txt"><div class="chk-t">RC Certificate</div><div class="chk-s">${rcStatus !== '—' ? rcStatus : 'Active'}</div></div><div class="chk-badge ok">ACTIVE</div></div>
      <div class="chk"><div class="ci">💰</div><div class="chk-txt"><div class="chk-t">Road Tax</div><div class="chk-s">Valid till ${taxUpto}</div></div><div class="chk-badge ok">PAID</div></div>
      <div class="chk ${loanOk ? '' : 'warn'}"><div class="ci">🏦</div><div class="chk-txt"><div class="chk-t">Financer / Loan</div><div class="chk-s">${loanOk ? 'No active loan on record' : financer}</div></div><div class="chk-badge ${loanOk ? 'ok' : 'warn'}">${loanOk ? 'CLEAR' : 'CHECK'}</div></div>
      <div class="chk ${blOk ? '' : 'danger'}"><div class="ci">🚫</div><div class="chk-txt"><div class="chk-t">Blacklist Status</div><div class="chk-s">${blOk ? 'No adverse records' : blacklist}</div></div><div class="chk-badge ${blOk ? 'ok' : 'red'}">${blOk ? 'CLEAR' : 'LISTED'}</div></div>
      ${pendingCount > 0 ? `<div class="chk danger" style="grid-column:1/-1;"><div class="ci">🧾</div><div class="chk-txt"><div class="chk-t">${pendingCount} Pending Challan${pendingCount > 1 ? 's' : ''} — ₹${totalFine.toLocaleString('en-IN')} Total Fine</div><div class="chk-s">${pendingArr.map(c => c.challan_no || '').filter(Boolean).join(' · ')}</div></div><div class="chk-badge red">PENDING</div></div>` : `<div class="chk" style="grid-column:1/-1;"><div class="ci">🧾</div><div class="chk-txt"><div class="chk-t">No Pending Challans</div><div class="chk-s">${challanStatus === 'no_challans' ? 'No challans issued on this vehicle' : challanStatus === 'failed' ? 'Challan data unavailable' : 'Clean record'}</div></div><div class="chk-badge ok">CLEAR</div></div>`}
    </div>
  </div>
  <div class="verdict ${pendingCount > 0 || insurClass !== 'valid' ? 'warn-v' : 'ok-v'}">
    <div class="verdict-icon">${pendingCount > 0 || insurClass !== 'valid' ? '⚠️' : '✅'}</div>
    <div>
      <h3>${pendingCount > 0 || insurClass !== 'valid' ? 'Review Recommended — Verify Before Purchase' : 'Vehicle Appears Clean — Verify Physical Condition'}</h3>
      <p>This <strong>${vehicleTitle}</strong> is currently with its <strong>${ownerLabel} owner</strong>.${insurClass !== 'valid' ? ` Insurance is <strong>${insurClass === 'expired' ? 'expired' : 'expiring soon'}</strong> (${insuranceUpto}).` : ' Insurance is valid.'} ${pendingCount > 0 ? `There ${pendingCount === 1 ? 'is' : 'are'} <strong>${pendingCount} pending challan${pendingCount > 1 ? 's' : ''}</strong> totalling ₹${totalFine.toLocaleString('en-IN')}.` : 'No pending challans found.'} A physical inspection is always recommended.</p>
    </div>
  </div>
  <div class="metrics">
    <div class="met"><div class="met-v ${insurClass !== 'valid' ? 'red' : ''}">${insurDays !== null ? (insurDays < 0 ? 'Expired' : `${insurDays} Days`) : 'N/A'}</div><div class="met-l">Insurance Left</div></div>
    <div class="met"><div class="met-v">${ownerLabel}</div><div class="met-l">Owner Count</div></div>
    <div class="met"><div class="met-v ${pendingCount > 0 ? 'red' : ''}">${pendingCount > 0 ? pendingCount+' Pending' : 'None'}</div><div class="met-l">Challans</div></div>
    <div class="met"><div class="met-v ${pendingCount > 0 ? 'red' : ''}">₹${totalFine > 0 ? totalFine.toLocaleString('en-IN') : '0'}</div><div class="met-l">Fine Due</div></div>
    <div class="met"><div class="met-v">${cubicCap !== '—' ? cubicCap+' cc' : normsDesc !== '—' ? normsDesc : 'N/A'}</div><div class="met-l">Engine</div></div>
    <div class="met"><div class="met-v">${saleAmt !== '—' && saleAmt !== '0' ? '₹'+parseFloat(saleAmt).toLocaleString('en-IN') : 'N/A'}</div><div class="met-l">Sale Value</div></div>
  </div>
  ` : notAvailableBox('🚗', 'RTO Data Not Available', `Vehicle details for ${vehicleNumber} could not be fetched from the RTO database at this time.`)}
  ${footer(1, totalPages)}
</div>`;

  // ── PAGE 2: Ownership & Registration ─────────────────────────────────────
  const ownerNum = parseInt(ownerSr, 10) || 1;
  const ownerColors = ['on-1','on-2','on-3','on-4','on-5'];
  const ownerRows = hasRTO ? Array.from({ length: ownerNum }, (_, i) => {
    const isLast = i === ownerNum - 1;
    const num = i + 1;
    const colorCls = ownerColors[Math.min(i, 4)];
    const nameDisplay = isLast ? ownerName : `Owner ${num}`;
    return `<tr class="${isLast ? 'current-owner' : 'prev-owner'}">
      <td><div class="owner-num ${colorCls}">${num}</div></td>
      <td><div class="owner-name-cell"><div><div class="owner-name-text" style="${isLast ? 'color:#1b5e20;' : ''}">${nameDisplay}</div><div class="owner-type-lbl" style="${isLast ? 'color:#2e7d32;font-weight:600;' : ''}">${isLast ? `${ownerSuffix(num)} owner — Current Owner` : `${ownerSuffix(num)} owner`}</div></div></div></td>
      <td style="font-size:11px;color:#475569;">${registeredAt !== '—' ? registeredAt : '—'}</td>
      <td><span class="badge badge-b">${regNo.substring(0,2)}</span></td>
      <td><span class="oh-status ${isLast ? 'oh-current' : 'oh-previous'}">${isLast ? '✅ Current' : '👤 Previous'}</span></td>
    </tr>`;
  }).join('') : '';

  const page2 = `
<div class="page">
  ${header(logoUrl, `${regNo} — Ownership History`, dateStr)}
  <div class="sec-hdr">👥 Ownership History${hasRTO ? ` — ${ownerLabel} Owner` : ''}</div>
  <div class="cs">
    ${hasRTO ? `
    <div class="owner-summary">
      <div class="os-card ${ownerNum >= 4 ? 'red' : ownerNum >= 2 ? 'orange' : 'blue'}">
        <div class="os-icon">👥</div><div class="os-val">${ownerNum}</div><div class="os-lbl">Total Owners on Record</div>
      </div>
      <div class="os-card blue">
        <div class="os-icon">📅</div><div class="os-val">${regDate}</div><div class="os-lbl">Registration Date</div>
      </div>
      <div class="os-card blue">
        <div class="os-icon">🏛️</div><div class="os-val" style="font-size:14px;">${registeredAt !== '—' ? registeredAt : 'RTO Office'}</div><div class="os-lbl">Registered At</div>
      </div>
    </div>
    <table class="oh-table" style="margin-bottom:16px;">
      <thead><tr><th style="width:44px;">#</th><th>Owner</th><th>RTO</th><th>State</th><th>Status</th></tr></thead>
      <tbody>${ownerRows}</tbody>
    </table>
    ${ownerNum >= 3 ? `<div class="alert warn"><div class="alert-ic">⚠️</div><div><h4>Multiple Ownership — Buyer Advisory</h4><p>A vehicle with ${ownerNum} owners may indicate frequent reselling. We recommend a certified pre-purchase inspection before any transaction.</p></div></div>` : ''}
    ` : notAvailableBox('👥', 'Ownership History Not Available', 'RTO data could not be fetched. Ownership history is unavailable.')}
  </div>
  <div class="sec-hdr">📋 Registration Details</div>
  <div class="cs" style="padding-top:14px;padding-bottom:10px;">
    ${hasRTO ? `
    <div class="info-grid" style="grid-template-columns:repeat(3,1fr);">
      <div class="icard"><div class="icard-lbl">🔢 Registration No.</div><div class="icard-val blue">${regNo}</div></div>
      <div class="icard"><div class="icard-lbl">📅 Registration Date</div><div class="icard-val">${regDate}</div></div>
      <div class="icard"><div class="icard-lbl">🏛️ Registered At</div><div class="icard-val">${registeredAt}</div></div>
      <div class="icard"><div class="icard-lbl">✅ RC Status</div><div class="icard-val"><span class="badge badge-g">● ${rcStatus !== '—' ? rcStatus : 'ACTIVE'}</span></div></div>
      <div class="icard"><div class="icard-lbl">🏦 Financer</div><div class="icard-val ${loanOk ? 'green' : 'red'}">${loanOk ? 'None (Loan Cleared)' : financer}</div></div>
      <div class="icard"><div class="icard-lbl">📍 Address</div><div class="icard-val" style="font-size:11px;">${presentAddress !== '—' ? presentAddress : '—'}</div></div>
    </div>` : notAvailableBox('📋', 'Registration Details Not Available', 'RTO database did not return registration information.')}
  </div>
  ${footer(2, totalPages)}
</div>`;

  // ── PAGE 3: Specifications ────────────────────────────────────────────────
  const page3 = `
<div class="page">
  ${header(logoUrl, `${regNo} — Vehicle Specifications`, dateStr)}
  <div class="sec-hdr">⚙️ Vehicle Specifications &amp; Technical Data</div>
  <div class="cs">
    ${hasRTO ? `
    <div class="spec-grid8">
      <div class="spec-card"><div class="spec-ic">🔧</div><div class="spec-lbl">Engine</div><div class="spec-val">${cubicCap !== '—' ? cubicCap : '—'}</div><div class="spec-unit">cc</div></div>
      <div class="spec-card g"><div class="spec-ic">🔩</div><div class="spec-lbl">Cylinders</div><div class="spec-val">${cylinders !== '—' ? cylinders : '—'}</div><div class="spec-unit">In-Line</div></div>
      <div class="spec-card o"><div class="spec-ic">💺</div><div class="spec-lbl">Seating</div><div class="spec-val">${seatCap !== '—' ? seatCap : '—'}</div><div class="spec-unit">Persons</div></div>
      <div class="spec-card p"><div class="spec-ic">⚖️</div><div class="spec-lbl">Unladen Wt.</div><div class="spec-val">${unldWt !== '—' ? unldWt : '—'}</div><div class="spec-unit">kg</div></div>
      <div class="spec-card"><div class="spec-ic">🚛</div><div class="spec-lbl">Gross Wt.</div><div class="spec-val">${gvw !== '—' ? gvw : '—'}</div><div class="spec-unit">kg</div></div>
      <div class="spec-card g"><div class="spec-ic">⛽</div><div class="spec-lbl">Fuel</div><div class="spec-val" style="font-size:11px;">${fuelType !== '—' ? fuelType.toUpperCase() : '—'}</div><div class="spec-unit">Type</div></div>
      <div class="spec-card o"><div class="spec-ic">🏷️</div><div class="spec-lbl">Body Type</div><div class="spec-val" style="font-size:11px;">${bodyType !== '—' ? bodyType.toUpperCase() : '—'}</div><div class="spec-unit">Category</div></div>
      <div class="spec-card p"><div class="spec-ic">🌱</div><div class="spec-lbl">Emission</div><div class="spec-val" style="font-size:11px;">${normsDesc !== '—' ? normsDesc.toUpperCase() : '—'}</div><div class="spec-unit">Norm</div></div>
    </div>
    <div class="two-col">
      <div class="stbl">
        <div class="stbl-hdr">🔧 Engine &amp; Performance</div>
        <div class="srow"><div class="srow-lbl">Manufacturer</div><div class="srow-val">${maker}</div></div>
        <div class="srow"><div class="srow-lbl">Model</div><div class="srow-val">${model}</div></div>
        <div class="srow"><div class="srow-lbl">Engine Capacity</div><div class="srow-val">${cubicCap !== '—' ? cubicCap+' cc' : '—'}</div></div>
        <div class="srow"><div class="srow-lbl">Cylinders</div><div class="srow-val">${cylinders}</div></div>
        <div class="srow"><div class="srow-lbl">Fuel Type</div><div class="srow-val">${fuelType}</div></div>
        <div class="srow"><div class="srow-lbl">Engine No.</div><div class="srow-val" style="font-family:monospace;font-size:10px;">${engineNo}</div></div>
        <div class="srow"><div class="srow-lbl">Emission Norm</div><div class="srow-val ${normsDesc && (normsDesc.includes('III') || normsDesc.includes('II') || normsDesc.includes('I')) ? 'red' : ''}">${normsDesc}</div></div>
        <div class="srow"><div class="srow-lbl">Mfg. Year</div><div class="srow-val">${mfgYear}</div></div>
      </div>
      <div class="stbl">
        <div class="stbl-hdr">🚗 Physical &amp; Classification</div>
        <div class="srow"><div class="srow-lbl">Body Type</div><div class="srow-val">${bodyType}</div></div>
        <div class="srow"><div class="srow-lbl">Vehicle Class</div><div class="srow-val">${vehicleClass}</div></div>
        <div class="srow"><div class="srow-lbl">Unladen Weight</div><div class="srow-val">${unldWt !== '—' ? unldWt+' kg' : '—'}</div></div>
        <div class="srow"><div class="srow-lbl">Gross Vehicle Wt.</div><div class="srow-val">${gvw !== '—' ? gvw+' kg' : '—'}</div></div>
        <div class="srow"><div class="srow-lbl">Seating Capacity</div><div class="srow-val">${seatCap !== '—' ? seatCap+' Persons' : '—'}</div></div>
        <div class="srow"><div class="srow-lbl">Colour</div><div class="srow-val">${color}</div></div>
        <div class="srow"><div class="srow-lbl">Tax Mode</div><div class="srow-val">${taxMode}</div></div>
        <div class="srow"><div class="srow-lbl">Chassis No.</div><div class="srow-val" style="font-family:monospace;font-size:10px;">${chassisNo}</div></div>
      </div>
    </div>
    ` : notAvailableBox('⚙️', 'Technical Specifications Not Available', 'RTO data could not be fetched. Vehicle specifications are unavailable.')}
  </div>
  ${footer(3, totalPages)}
</div>`;

  // ── PAGE 4: Legal & Compliance ────────────────────────────────────────────
  const challanCards = [...pendingArr.map(c => ({ ...c, _type: 'pending' })), ...disposedArr.map(c => ({ ...c, _type: 'disposed' }))];

  function challanCard(c, idx) {
    const isPending = c._type === 'pending' || String(c.challan_status || '').toLowerCase() !== 'disposed';
    const offences = Array.isArray(c.offence_details) ? c.offence_details : (c.offence_details ? [c.offence_details] : []);
    return `<div class="challan-card">
      <div class="challan-header">
        <div class="challan-header-left">
          <h3>🧾 Challan #${idx+1}${c.challan_no ? ' — ' + c.challan_no : ''}</h3>
          <p>${c.challan_date_time || ''} ${c.challan_place ? ' · ' + c.challan_place : ''} ${c.department ? ' · Dept: ' + c.department : ''}</p>
        </div>
        <div class="challan-status-pill${isPending ? '' : ' disposed'}">${isPending ? '⏳ PENDING' : '✅ DISPOSED'}</div>
      </div>
      <div class="challan-body">
        <div class="challan-meta">
          <div class="cm-item"><div class="cm-label">📅 Date &amp; Time</div><div class="cm-value">${c.challan_date_time || '—'}</div></div>
          <div class="cm-item"><div class="cm-label">📍 Location</div><div class="cm-value">${c.challan_place || '—'}</div></div>
          <div class="cm-item"><div class="cm-label">💰 Fine Imposed</div><div class="cm-value ${isPending ? 'red' : ''}">₹ ${c.fine_imposed ? parseFloat(c.fine_imposed).toLocaleString('en-IN') : '—'}</div></div>
          <div class="cm-item"><div class="cm-label">👤 Violator</div><div class="cm-value">${c.name_of_violator || c.driver_name || '—'}</div></div>
          <div class="cm-item"><div class="cm-label">🏛️ Status</div><div class="cm-value ${isPending ? 'red' : ''}">${isPending ? 'PENDING' : 'DISPOSED'}</div></div>
          <div class="cm-item"><div class="cm-label">⚖️ RTO District</div><div class="cm-value">${c.rto_distric_name || c.state_code || '—'}</div></div>
        </div>
        ${offences.length > 0 ? `<div class="offence-list"><h4>⚠ Offences Recorded</h4>${offences.map(o => `<div class="offence-item"><span class="offence-act">${typeof o === 'object' ? (o.act_section || 'Act') : 'Offence'}</span><span class="offence-name">${typeof o === 'object' ? (o.offence_name || JSON.stringify(o)) : String(o)}</span></div>`).join('')}</div>` : (c.remark ? `<div class="offence-list"><h4>⚠ Remark</h4><div class="offence-item"><span class="offence-name">${c.remark}</span></div></div>` : '')}
        ${c.court_name ? `<div style="background:#f8fafc;border-radius:7px;padding:9px 12px;border:1px solid #e2e8f0;margin-top:10px;font-size:11px;"><strong>⚖️ ${c.court_name}</strong>${c.court_address ? ' · ' + c.court_address : ''}</div>` : ''}
      </div>
    </div>`;
  }

  const page4 = `
<div class="page">
  ${header(logoUrl, `${regNo} — Legal &amp; Compliance`, dateStr)}
  <div class="sec-hdr ${pendingCount > 0 || insurClass !== 'valid' ? 'danger' : ''}">🚨 Legal &amp; Compliance Status${pendingCount > 0 || insurClass !== 'valid' ? ' — Action Required' : ' — All Clear'}</div>
  <div class="cs">
    ${hasRTO ? `
    <div class="comp-grid">
      <div class="comp-card">
        <div class="comp-hdr ${insurClass === 'valid' ? 'active' : 'danger'}"><div class="comp-ic">🛡️</div><div><div>Insurance</div><div class="comp-status-lbl">${insurClass === 'valid' ? '● Valid' : insurClass === 'warning' ? `🚨 ${insurDays} days left` : '❌ Expired'}</div></div></div>
        <div class="comp-body">
          <div class="comp-lbl">Company</div><div class="comp-val" style="font-size:11px;">${insuranceComp}</div>
          <div class="comp-lbl">Policy No.</div><div class="comp-val sm">${insurancePolicyNo}</div>
          <div class="comp-lbl">Expires</div><div class="comp-val ${insurClass !== 'valid' ? 'red' : ''}">${insuranceUpto}</div>
          <div class="vbar"><div class="vbar-fill ${insurClass !== 'valid' ? 'red' : ''}" style="width:${pct(insurDays)}%;"></div></div>
          <div class="vbar-days ${insurClass !== 'valid' ? 'red' : ''}">${insurDays !== null ? (insurDays < 0 ? `⚠ Expired ${Math.abs(insurDays)} days ago` : `${insurDays} days remaining`) : '—'}</div>
        </div>
      </div>
      <div class="comp-card">
        <div class="comp-hdr ${puccClass === 'valid' ? 'active' : 'warn'}"><div class="comp-ic">🌿</div><div><div>PUCC Certificate</div><div class="comp-status-lbl">${puccClass === 'valid' ? '● Valid' : '⚠ Check'}</div></div></div>
        <div class="comp-body">
          <div class="comp-lbl">PUCC No.</div><div class="comp-val sm">${puccNo}</div>
          <div class="comp-lbl">Valid Upto</div><div class="comp-val">${puccUpto}</div>
          <div class="vbar"><div class="vbar-fill ${puccClass !== 'valid' ? 'orange' : ''}" style="width:${pct(puccDays, 180)}%;"></div></div>
          <div class="vbar-days ${puccClass !== 'valid' ? 'red' : ''}">${puccDays !== null ? (puccDays < 0 ? `⚠ Expired` : `~${puccDays} days remaining`) : '—'}</div>
        </div>
      </div>
      <div class="comp-card">
        <div class="comp-hdr active"><div class="comp-ic">📋</div><div><div>RC Certificate</div><div class="comp-status-lbl">● ${rcStatus !== '—' ? rcStatus : 'Active'}</div></div></div>
        <div class="comp-body">
          <div class="comp-lbl">Registration No.</div><div class="comp-val" style="font-size:14px;letter-spacing:1px;">${regNo}</div>
          <div class="comp-lbl">RTO</div><div class="comp-val">${registeredAt}</div>
          <div class="comp-lbl">Status</div><div class="comp-val">${rcStatus !== '—' ? rcStatus : 'ACTIVE'}</div>
          <div class="vbar"><div class="vbar-fill" style="width:80%;"></div></div>
        </div>
      </div>
      <div class="comp-card">
        <div class="comp-hdr active"><div class="comp-ic">💰</div><div><div>Road Tax</div><div class="comp-status-lbl">● Paid</div></div></div>
        <div class="comp-body">
          <div class="comp-lbl">Tax Mode</div><div class="comp-val">${taxMode !== '—' ? taxMode : 'N/A'}</div>
          <div class="comp-lbl">Valid Upto</div><div class="comp-val">${taxUpto}</div>
          <div class="vbar"><div class="vbar-fill" style="width:${pct(taxDays)}%;"></div></div>
          <div class="vbar-days">${taxDays !== null ? `~${taxDays} days remaining` : '—'}</div>
        </div>
      </div>
      <div class="comp-card">
        <div class="comp-hdr active"><div class="comp-ic">🔧</div><div><div>Fitness Certificate</div><div class="comp-status-lbl">● Valid</div></div></div>
        <div class="comp-body">
          <div class="comp-lbl">Fitness Upto</div><div class="comp-val">${fitUpto}</div>
          <div class="vbar"><div class="vbar-fill" style="width:${pct(fitDays)}%;"></div></div>
          <div class="vbar-days">${fitDays !== null ? `~${fitDays} days remaining` : '—'}</div>
        </div>
      </div>
      <div class="comp-card">
        <div class="comp-hdr ${blOk ? 'active' : 'danger'}"><div class="comp-ic">🚫</div><div><div>Blacklist Status</div><div class="comp-status-lbl">${blOk ? '● Clear' : '❌ Check'}</div></div></div>
        <div class="comp-body">
          <div class="comp-lbl">Status</div><div class="comp-val ${blOk ? '' : 'red'}">${blacklist !== '—' ? blacklist : (blOk ? 'NOT BLACKLISTED' : 'CHECK WITH RTO')}</div>
        </div>
      </div>
    </div>
    ` : notAvailableBox('📋', 'Compliance Data Not Available', 'RTO data could not be fetched.')}
    ${hasChallan ? (challanCards.length > 0 ? challanCards.map((c, i) => challanCard(c, i)).join('') : `<div class="bl-banner"><div class="bl-ic">🏆</div><div class="bl-text" style="flex:1;"><h3>No Challans Found — Clean Record</h3><p>${regNo} has no pending or disposed challans on record.</p></div><div class="bl-tag">✓ CLEAN</div></div>`) : notAvailableBox('🧾', 'Challan Data Not Available', 'Challan records could not be fetched from the eChallan system.')}
    ${insurClass === 'warning' ? `<div class="alert danger"><div class="alert-ic">🚨</div><div><h4>URGENT: Insurance Renewal Due in ${insurDays} Days — ${insuranceUpto}</h4><p>Renew insurance immediately to avoid legal penalties under Section 146 of the Motor Vehicles Act.</p></div></div>` : ''}
    ${puccClass !== 'valid' && puccDays !== null ? `<div class="alert warn"><div class="alert-ic">⚠️</div><div><h4>PUCC Renewal Required</h4><p>Pollution Under Control Certificate ${puccDays < 0 ? 'has expired' : `expires on ${puccUpto}`}. Schedule a PUCC check at an authorised testing centre.</p></div></div>` : ''}
  </div>
  ${footer(4, totalPages)}
</div>`;

  // ── PAGE 5: Financial & Summary ───────────────────────────────────────────
  const page5 = `
<div class="page">
  ${header(logoUrl, `${regNo} — Financial Details &amp; Summary`, dateStr)}
  <div class="fin-hero">
    <div>
      <div class="fin-lbl">Original Invoice / Purchase Value</div>
      <div class="fin-amt">${saleAmt !== '—' && saleAmt !== '0' ? '₹ ' + parseFloat(saleAmt).toLocaleString('en-IN') : 'N/A'}</div>
      <div class="fin-sub">As recorded in RTO registration data</div>
    </div>
    <div style="text-align:center;">
      <div class="fin-lbl">Ownership</div>
      <div style="font-size:22px;font-weight:700;color:${ownerNum >= 3 ? '#fca5a5' : '#fff'};">${ownerLabel} Owner</div>
      <div class="fin-sub">${ownerNum > 1 ? ownerNum - 1 + ' previous owner(s)' : 'First owner'}</div>
    </div>
    <div style="text-align:center;">
      <div class="fin-lbl">Vehicle Year</div>
      <div style="font-size:22px;font-weight:700;color:#fff;">${mfgYear !== '—' ? mfgYear : 'N/A'}</div>
      <div class="fin-sub">Registration: ${regDate}</div>
    </div>
  </div>
  <div class="cs" style="padding-bottom:8px;">
    <div class="big-stats">
      <div class="bstat y"><div class="bstat-ic">📊</div><div class="bstat-val" style="color:#92400e;">${healthScore}/100</div><div class="bstat-lbl">Health Score — Grade ${healthGrade}</div></div>
      <div class="bstat ${insurClass !== 'valid' ? 'r' : ''}"><div class="bstat-ic">🛡️</div><div class="bstat-val" style="${insurClass !== 'valid' ? 'color:#c62828;' : ''}">${insurDays !== null ? (insurDays < 0 ? 'Expired' : `${insurDays} Days`) : 'N/A'}</div><div class="bstat-lbl">Insurance Remaining</div></div>
      <div class="bstat ${pendingCount > 0 ? 'r' : ''}"><div class="bstat-ic">🧾</div><div class="bstat-val" style="${pendingCount > 0 ? 'color:#c62828;' : ''}">${pendingCount > 0 ? '₹'+totalFine.toLocaleString('en-IN') : 'None'}</div><div class="bstat-lbl">${pendingCount > 0 ? 'Pending Challan Fine' : 'No Pending Challans'}</div></div>
    </div>
    <div class="ibox ibox-red">
      <div class="ibox-icon">🛒</div>
      <div>
        <h4>Buyer's Checklist Before Purchase</h4>
        <p>
          ${pendingCount > 0 ? `✦ <strong>Clear pending challan${pendingCount > 1 ? 's' : ''} of ₹${totalFine.toLocaleString('en-IN')}</strong><br>` : ''}
          ${insurClass !== 'valid' ? `✦ <strong>${insurClass === 'expired' ? 'Renew Insurance immediately — already expired' : `Renew Insurance soon — expires ${insuranceUpto}`}</strong><br>` : ''}
          ✦ <strong>Physical inspection mandatory</strong> — always verify engine/chassis numbers against RC<br>
          ✦ <strong>Check for accident history</strong> — RTO data does not include accident records<br>
          ${!loanOk ? `✦ <strong>Obtain NOC from financer</strong> (${financer}) before ownership transfer<br>` : '✦ <strong>No NOC needed from bank</strong> — no active financer on record<br>'}
          ${puccClass !== 'valid' ? `✦ <strong>PUCC renewal required</strong> — expires ${puccUpto}<br>` : ''}
          ✦ <strong>Verify seller's identity</strong> — match with RC ownership records
        </p>
      </div>
    </div>
    <div class="sdiv"><span>Glossary of Terms</span></div>
    <div class="gloss">
      <div class="gloss-title">📖 Glossary</div>
      <div class="gloss-grid">
        <div class="gloss-item"><div class="gloss-term">RC</div><div class="gloss-def">Registration Certificate — official vehicle registration document</div></div>
        <div class="gloss-item"><div class="gloss-term">PUCC</div><div class="gloss-def">Pollution Under Control Certificate — mandatory emission check</div></div>
        <div class="gloss-item"><div class="gloss-term">LMV</div><div class="gloss-def">Light Motor Vehicle — GVW under 7,500 kg</div></div>
        <div class="gloss-item"><div class="gloss-term">NOC</div><div class="gloss-def">No Objection Certificate — required from financer for transfer</div></div>
        <div class="gloss-item"><div class="gloss-term">GVW</div><div class="gloss-def">Gross Vehicle Weight — max operating weight incl. load</div></div>
        <div class="gloss-item"><div class="gloss-term">RTO</div><div class="gloss-def">Regional Transport Office — vehicle registration authority</div></div>
        <div class="gloss-item"><div class="gloss-term">ULIP</div><div class="gloss-def">Unified Logistics Interface Platform — Govt. data API</div></div>
        <div class="gloss-item"><div class="gloss-term">N/A</div><div class="gloss-def">Not Available — data not returned from source database</div></div>
      </div>
    </div>
  </div>
  <div class="disclaimer">
    This report was generated on ${dateStr} and is valid until ${expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '30 days from generation'}. Data is sourced from Vahan / eChallan government databases via ULIP APIs. Some data fields may be masked due to privacy regulations. SmartChallan / Maavin Technologies is not responsible for inaccuracies or discrepancies. This report is for informational purposes only.
  </div>
  ${footer(5, totalPages)}
</div>`;

  // ── Assemble ──────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vehicle History Report — ${regNo}</title>
<style>${CSS}</style>
</head>
<body>
${page1}
${page2}
${page3}
${page4}
${page5}
</body>
</html>`;
}
