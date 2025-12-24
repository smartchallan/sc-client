import React, { useState, useEffect, useRef } from "react";
import SelectShowMore from "./SelectShowMore";
import { FaSyncAlt, FaEye } from "react-icons/fa";
import { FiDownloadCloud, FiPrinter } from "react-icons/fi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import BlueTickIcon from "./BlueTickIcon";
import CustomModal from "./CustomModal";
import scLogo from "../assets/sc-logo.png";
import html2canvas from "html2canvas";
import "../RegisterVehicle.css";

// Helper to parse various date formats and handle object fields like { value, status }
const parseFlexibleDate = (raw) => {
  if (!raw || raw === '-') return null;

  let val = raw;
  if (typeof val === 'object') {
    if (val && val.value) {
      val = val.value;
    } else if (val && val.date) {
      val = val.date;
    } else {
      return null;
    }
  }

  if (typeof val !== 'string') {
    val = String(val);
  }

  if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(val)) return new Date(val.replace(/-/g, ' '));
  if (/\d{2}-\d{2}-\d{4}/.test(val)) {
    const [d, m, y] = val.split('-');
    return new Date(`${y}-${m}-${d}`);
  }
  if (/\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val);

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// Download as Excel
const handleDownload = (rows) => {
  const exportData = rows.map(row => ({
    'Vehicle Number': row.vehicle_number,
    'Registration Date': row.rc_regn_dt || row.registration_date || row.registered_at,
    'Insurance Upto': typeof (row.rc_insurance_upto || row.insurance_exp) === 'object' ? (row.rc_insurance_upto || row.insurance_exp).value : (row.rc_insurance_upto || row.insurance_exp),
    'Road Tax Upto': typeof (row.rc_tax_upto || row.road_tax_exp) === 'object' ? (row.rc_tax_upto || row.road_tax_exp).value : (row.rc_tax_upto || row.road_tax_exp),
    'Fitness Upto': typeof (row.rc_fit_upto || row.fitness_exp) === 'object' ? (row.rc_fit_upto || row.fitness_exp).value : (row.rc_fit_upto || row.fitness_exp),
    'Pollution Upto': typeof (row.rc_pucc_upto || row.pollution_exp) === 'object' ? (row.rc_pucc_upto || row.pollution_exp).value : (row.rc_pucc_upto || row.pollution_exp),
    'Vehicle Challans': row.pending_challan_count,
    'Settled Challans': row.disposed_challan_count
  }));
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fleet");
  XLSX.writeFile(wb, "MyFleet.xlsx");
};

// Build a printable / exportable version of the table HTML (used by print and PDF)
const buildPrintableTableHtml = () => {
  const printArea = document.getElementById("my-fleet-table-print-area");
  if (!printArea) return null;
  const table = printArea.querySelector('table');
  if (!table) return null;

  const printTable = table.cloneNode(true);

  try {
    const theadRows = printTable.querySelectorAll('thead tr');
    theadRows.forEach((tr, rowIndex) => {
      const cells = tr.querySelectorAll('th');
      if (cells.length >= 1) {
        // Remove the last header cell (View column) from all header rows for print/PDF
        tr.removeChild(cells[cells.length - 1]);
      }
    });

    const bodyRows = printTable.querySelectorAll('tbody tr');
    bodyRows.forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      if (cells.length >= 1) {
        // Remove the last cell (View column) from each body row
        tr.removeChild(cells[cells.length - 1]);
      }
    });
  } catch (e) {
    // ignore and fall back to original clone
  }

  return printTable.outerHTML;
};

// Print table in a new window using branding header
const handlePrint = () => {
  const tableHtml = buildPrintableTableHtml();
  if (!tableHtml) return;

  const win = window.open('', '', 'height=700,width=1200');
  if (!win) return;
  win.document.write('<html><head><title>My Fleet</title>');
  win.document.write('<link rel="stylesheet" href="/src/LatestTable.css" />');
  win.document.write('<style>body { margin: 16px; font-family: Segoe UI, Arial, sans-serif; } .sc-branding { display:flex; align-items:center; gap:12px; margin-bottom:16px; } .sc-branding-logo { height:24px !important; max-width:120px !important; object-fit:contain !important; } .sc-branding-text { display:flex; flex-direction:column; } .sc-branding-title { font-size:18px; font-weight:700; color:#1565c0; margin:0; } .sc-branding-sub { font-size:11px; color:#555; margin:4px 0 0; } body .latest-table th, body .latest-table td { padding: 6px 8px !important; font-size: 80% !important; } table { width:100%; border-collapse:collapse; }</style>');
  win.document.write('</head><body>');
  win.document.write('<div class="sc-branding">');
  win.document.write(`<img class="sc-branding-logo" src="${scLogo}" alt="Smart Challan Logo" />`);
  win.document.write('<div class="sc-branding-text">');
  win.document.write('<p class="sc-branding-sub">My Fleet Summary</p>');
  win.document.write('</div>');
  win.document.write('</div>');
  win.document.write(tableHtml);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
};

// Download branded PDF directly using jsPDF (no print dialog)
const handleDownloadPdf = () => {
  const tableHtml = buildPrintableTableHtml();
  if (!tableHtml) return;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = `
    <div class="sc-branding">
      <img class="sc-branding-logo" style="height:36px; max-width:180px; object-fit:contain;" src="${scLogo}" alt="Smart Challan Logo" />
      <div class="sc-branding-text">
        <p class="sc-branding-sub">My Fleet Summary</p>
      </div>
    </div>
    ${tableHtml}
  `;
  document.body.appendChild(container);
  // Give images (logo, etc.) a short time to load before capture
  setTimeout(() => {
    html2canvas(container, {
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => {
        // Skip SVG icons (react-icons etc.) which can break html2canvas
        return element instanceof SVGElement || element.tagName?.toLowerCase() === 'svg';
      }
    })
      .then((canvas) => {
        // Use JPEG to avoid strict PNG signature issues in jsPDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('l', 'pt', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const marginX = 20;
        const marginY = 20;
        const availableWidth = pageWidth - marginX * 2;
        const availableHeight = pageHeight - marginY * 2;

        const imgWidth = availableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = marginY;

        // First page
        pdf.addImage(imgData, 'JPEG', marginX, position, imgWidth, imgHeight);
        heightLeft -= availableHeight;

        // Additional pages (if content taller than one page)
        while (heightLeft > 0) {
          pdf.addPage();
          position = marginY - (imgHeight - heightLeft);
          pdf.addImage(imgData, 'JPEG', marginX, position, imgWidth, imgHeight);
          heightLeft -= availableHeight;
        }

        pdf.save('MyFleet.pdf');
      })
      .finally(() => {
        document.body.removeChild(container);
      });
  }, 400);
};

export default function MyFleetTable({
  data,
  loading,
  onRefresh,
  onView,
  totalCount,
  upcomingRenewalRange,
  filteredFleet = null,
  goToFleetRenewal = null,
  onConsumeFleetRenewal,
}) {
  // Sorting state for each date column
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  // Helper to handle sort
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        // Toggle direction
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Helper to get date value for sorting
  const getDateValue = (v, key) => {
    let val = v[key];

    // Fallbacks for different API field names
    if (!val || val === '-') {
      if (key === 'rc_regn_dt') {
        val = v.rc_regn_dt || v.registration_date || v.registered_at;
      } else if (key === 'rc_insurance_upto') {
        val = v.rc_insurance_upto || v.insurance_exp;
      } else if (key === 'rc_tax_upto') {
        val = v.rc_tax_upto || v.road_tax_exp;
      } else if (key === 'rc_fit_upto') {
        val = v.rc_fit_upto || v.fitness_exp;
      } else if (key === 'rc_pucc_upto') {
        val = v.rc_pucc_upto || v.pollution_exp;
      }
    }

    const d = parseFlexibleDate(val);
    return d ? d.getTime() : 0;
  };
  // Vehicle number search state
  const [vehicleNumberSearch, setVehicleNumberSearch] = useState("");
  // Expired filter: multiple types (insurance, roadtax, fitness, pollution)
  const [expiredTypes, setExpiredTypes] = useState([]); // e.g. ['insurance', 'roadtax']
  const [showExpiredDropdown, setShowExpiredDropdown] = useState(false);
  // Urgent renewals filter: multiple types and day range
  const [urgentTypes, setUrgentTypes] = useState([]); // e.g. ['insurance', 'roadtax']
  const [showUrgentDropdown, setShowUrgentDropdown] = useState(false);
  const [urgentRange, setUrgentRange] = useState(15); // days, default 15
  // Challan filter: pending/disposed
  const [challanTypes, setChallanTypes] = useState([]); // e.g. ['pending', 'disposed']
  const [showChallanDropdown, setShowChallanDropdown] = useState(false);

  // Download format modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('excel'); // 'excel' | 'pdf'

  // Refs for detecting clicks outside dropdowns
  const expiredDropdownRef = useRef(null);
  const urgentDropdownRef = useRef(null);
  const challanDropdownRef = useRef(null);

  // Close dropdowns when clicking outside their area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expiredDropdownRef.current && !expiredDropdownRef.current.contains(event.target)) {
        setShowExpiredDropdown(false);
      }
      if (urgentDropdownRef.current && !urgentDropdownRef.current.contains(event.target)) {
        setShowUrgentDropdown(false);
      }
      if (challanDropdownRef.current && !challanDropdownRef.current.contains(event.target)) {
        setShowChallanDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // When coming from the dashboard Vehicle Renewals stat card,
  // auto-select the corresponding "expired" filter once.
  useEffect(() => {
    if (!goToFleetRenewal) return;

    const mapRenewalToExpiredType = (key) => {
      if (key === 'insurance') return 'insurance';
      if (key === 'roadTax') return 'roadtax';
      if (key === 'fitness') return 'fitness';
      if (key === 'pollution') return 'pollution';
      return null;
    };

    const mapped = mapRenewalToExpiredType(goToFleetRenewal);
    if (mapped) {
      // Match behaviour of manual expired filter selection:
      // clear other filters and set the chosen expired type.
      setUrgentTypes([]);
      setChallanTypes([]);
      setExpiredTypes([mapped]);
    }

    if (onConsumeFleetRenewal) {
      onConsumeFleetRenewal();
    }
  }, [goToFleetRenewal, onConsumeFleetRenewal]);
  // Sort by selected column or registered_at DESC
  let sortedAll = [...(filteredFleet || data || [])];
  if (sortConfig.key) {
    sortedAll.sort((a, b) => {
      const aVal = getDateValue(a, sortConfig.key);
      const bVal = getDateValue(b, sortConfig.key);
      if (sortConfig.direction === 'asc') return aVal - bVal;
      return bVal - aVal;
    });
  } else {
    sortedAll.sort((a, b) => {
      const bd = parseFlexibleDate(b.registered_at || b.rc_regn_dt || b.registration_date);
      const ad = parseFlexibleDate(a.registered_at || a.rc_regn_dt || a.registration_date);
      const bt = bd ? bd.getTime() : 0;
      const at = ad ? ad.getTime() : 0;
      return bt - at;
    });
  }
  // Vehicle number search filter
  if (vehicleNumberSearch.trim() !== "") {
    sortedAll = sortedAll.filter(v =>
      (v.vehicle_number || "").toUpperCase().includes(vehicleNumberSearch.trim().toUpperCase())
    );
  }
  // Apply expired filter (multi)
  if (expiredTypes.length > 0) {
    sortedAll = sortedAll.filter(v => {
      return expiredTypes.some(type => {
        let exp = '-';
        if (type === 'insurance') exp = v.rc_insurance_upto || v.insurance_exp;
        else if (type === 'roadtax') exp = v.rc_tax_upto || v.road_tax_exp;
        else if (type === 'fitness') exp = v.rc_fit_upto || v.fitness_exp;
        else if (type === 'pollution') exp = v.rc_pucc_upto || v.pollution_exp;
        const d = parseFlexibleDate(exp);
        if (!d) return false;
        const now = new Date();
        return d < now;
      });
    });
  }
  // Apply urgent renewals filter (multi, range)
  if (urgentTypes.length > 0) {
    sortedAll = sortedAll.filter(v => {
      return urgentTypes.some(type => {
        let exp = '-';
        if (type === 'insurance') exp = v.rc_insurance_upto || v.insurance_exp;
        else if (type === 'roadtax') exp = v.rc_tax_upto || v.road_tax_exp;
        else if (type === 'fitness') exp = v.rc_fit_upto || v.fitness_exp;
        else if (type === 'pollution') exp = v.rc_pucc_upto || v.pollution_exp;
        const d = parseFlexibleDate(exp);
        if (!d) return false;
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= urgentRange;
      });
    });
  }
  // Apply challan filter (pending/disposed)
  if (challanTypes.length > 0) {
    sortedAll = sortedAll.filter(v => {
      let match = false;
      if (challanTypes.includes('pending') && v.pending_challan_count > 0) match = true;
      if (challanTypes.includes('disposed') && v.disposed_challan_count > 0) match = true;
      return match;
    });
  }
  // Default visible count is 30
  const [visibleCount, setVisibleCount] = React.useState(30);
  const visibleRows = sortedAll.slice(0, visibleCount);

  // Helper to check if all expiry fields are fit
  const isAllFit = (row) => {
    const now = new Date();
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      if (typeof dateStr === 'object' && dateStr !== null && dateStr.value) return new Date(dateStr.value);
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) return new Date(dateStr.replace(/-/g, ' '));
      if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [d, m, y] = dateStr.split('-');
        return new Date(`${y}-${m}-${d}`);
      }
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
      return new Date(dateStr);
    };
    // Helper for new API format: { value, status }
    const isFit = (field) => {
      if (field && typeof field === 'object' && field.status) {
        return field.status === 'fit';
      }
      return false;
    };
    return (
      isFit(row.rc_insurance_upto || row.insurance_exp) &&
      isFit(row.rc_tax_upto || row.road_tax_exp) &&
      isFit(row.rc_fit_upto || row.fitness_exp) &&
      isFit(row.rc_pucc_upto || row.pollution_exp)
    );
  };
  return (
    <><p className="page-subtitle">Quick summary for your fleet. Track your <b>expired vehicles</b>, <b>upcoming renewals</b>, and <b>challan statuses</b>.</p><div className="dashboard-latest" style={{
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 12px 0 rgba(30,136,229,0.07)',
      border: '1.5px solid #e3eaf1',
      padding: '0 0 18px 0',
      marginBottom: 0,
      minHeight: 340,
      transition: 'box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{ margin: 0, fontSize: 19, color: '#1565c0', letterSpacing: '0.01em', fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.2, fontWeight: 700 }}>My Fleet</h2>
        </div>
        <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, display: 'inline-block', marginLeft: 0, boxShadow: '0 1px 4px #21cbf322' }}>
          Showing {visibleRows.length} of {sortedAll.length} records
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 18,
        marginTop: 0,
        flexWrap: 'wrap',
        background: '#f5f8fa',
        borderRadius: 8,
        padding: '16px 18px 10px 18px',
        border: '1.5px solid #e3eaf1',
        boxShadow: '0 1px 4px #21cbf322',
        position: 'relative',
        // maxWidth: 1200
      }}>
        {/* Controls row: search, filters, right-aligned print/download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1 }}>
          {/* Vehicle number search styled as number plate */}
          <div style={{ width: 300 }}>
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
                  placeholder="Search Vehicle Number"
                  value={vehicleNumberSearch}
                  onChange={e => setVehicleNumberSearch(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="number-plate-input"
                  maxLength={12} />
              </div>
              <div className="security-features">
                <div className="hologram"></div>
                <div className="chakra">⚙</div>
              </div>
            </div>
          </div>
          {/* Expired, urgent, and challan filters as siblings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            {/* Expired records filter */}
            <div style={{ position: 'relative' }} ref={expiredDropdownRef}>
              <button
                className="filter-select"
                style={{ minWidth: 180, textAlign: 'left', padding: '16px 15px', border: '1px solid #bcd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                onClick={() => setShowExpiredDropdown(v => !v)}
              >
                {expiredTypes.length === 0 ? 'Select expired records' : expiredTypes.map(t => {
                  if (t === 'insurance') return 'Insurance';
                  if (t === 'roadtax') return 'Road Tax';
                  if (t === 'fitness') return 'Fitness';
                  if (t === 'pollution') return 'Pollution';
                  return t;
                }).join(', ')}
                {expiredTypes.length > 0 && (
                  <span style={{
                    marginLeft: 8,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: '#e3f2fd',
                    color: '#1565c0',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {expiredTypes.length}
                  </span>
                )}
                <span style={{ float: 'right', fontWeight: 700, fontSize: 16, marginLeft: 8 }}>▼</span>
              </button>
              {showExpiredDropdown && (
                <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 10, background: '#fff', border: '1.5px solid #bcd', borderRadius: 8, boxShadow: '0 2px 8px #0001', minWidth: 180, padding: 8 }}>
                  {['insurance', 'roadtax', 'fitness', 'pollution'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={expiredTypes.includes(type)}
                        onChange={e => {
                          // When using expired filter, reset other filters
                          setUrgentTypes([]);
                          setChallanTypes([]);
                          if (e.target.checked) setExpiredTypes(prev => [...prev, type]);
                          else setExpiredTypes(prev => prev.filter(t => t !== type));
                        } } />
                      {type === 'insurance' ? 'Insurance' : type === 'roadtax' ? 'Road Tax' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#fff', cursor: 'pointer' }}
                      onClick={() => setExpiredTypes([])}
                    >
                      Reset
                    </button>
                    <button
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#f5f8fa', cursor: 'pointer' }}
                      onClick={() => setShowExpiredDropdown(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Urgent renewals filter */}
            <div style={{ position: 'relative' }} ref={urgentDropdownRef}>
              <button
                className="filter-select"
                style={{ minWidth: 180, textAlign: 'left', padding: '16px 15px', border: '1px solid #bcd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                onClick={() => setShowUrgentDropdown(v => !v)}
              >
                {urgentTypes.length === 0 ? 'Select urgent renewals' : urgentTypes.map(t => {
                  if (t === 'insurance') return 'Insurance';
                  if (t === 'roadtax') return 'Road Tax';
                  if (t === 'fitness') return 'Fitness';
                  if (t === 'pollution') return 'Pollution';
                  return t;
                }).join(', ')}
                {urgentTypes.length > 0 && (
                  <span style={{
                    marginLeft: 8,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {urgentTypes.length}
                  </span>
                )}
                <span style={{ float: 'right', fontWeight: 700, fontSize: 16, marginLeft: 8 }}>▼</span>
              </button>
              {showUrgentDropdown && (
                <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 10, background: '#fff', border: '1.5px solid #bcd', borderRadius: 8, boxShadow: '0 2px 8px #0001', minWidth: 220, padding: 8 }}>
                  {['insurance', 'roadtax', 'fitness', 'pollution'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={urgentTypes.includes(type)}
                        onChange={e => {
                          // When using urgent filter, reset other filters
                          setExpiredTypes([]);
                          setChallanTypes([]);
                          if (e.target.checked) setUrgentTypes(prev => [...prev, type]);
                          else setUrgentTypes(prev => prev.filter(t => t !== type));
                        } } />
                      {type === 'insurance' ? 'Insurance' : type === 'roadtax' ? 'Road Tax' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13 }}>Days:</span>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={urgentRange}
                      onChange={e => setUrgentRange(Number(e.target.value))}
                      style={{ width: 120 }} />
                    <span style={{ fontSize: 13, minWidth: 28, display: 'inline-block', textAlign: 'center', fontWeight: 600, color: '#1976d2' }}>{urgentRange}</span>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#fff', cursor: 'pointer' }}
                      onClick={() => { setUrgentTypes([]); setUrgentRange(15); } }
                    >
                      Reset
                    </button>
                    <button
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#f5f8fa', cursor: 'pointer' }}
                      onClick={() => setShowUrgentDropdown(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Challan filter */}
            <div style={{ position: 'relative' }} ref={challanDropdownRef}>
              <button
                className="filter-select"
                style={{ minWidth: 180, textAlign: 'left', padding: '16px 15px', border: '1px solid #bcd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                onClick={() => setShowChallanDropdown(v => !v)}
              >
                {challanTypes.length === 0 ? 'Select challan type' : challanTypes.map(t => t === 'pending' ? 'Pending Challan' : t === 'disposed' ? 'Disposed Challan' : t).join(', ')}
                {challanTypes.length > 0 && (
                  <span style={{
                    marginLeft: 8,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: '#fff3e0',
                    color: '#ef6c00',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {challanTypes.length}
                  </span>
                )}
                <span style={{ float: 'right', fontWeight: 700, fontSize: 16, marginLeft: 8 }}>▼</span>
              </button>
              {showChallanDropdown && (
                <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 10, background: '#fff', border: '1.5px solid #bcd', borderRadius: 8, boxShadow: '0 2px 8px #0001', minWidth: 180, padding: 8 }}>
                  {['pending', 'disposed'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={challanTypes.includes(type)}
                        onChange={e => {
                          // When using challan filter, reset other filters
                          setExpiredTypes([]);
                          setUrgentTypes([]);
                          if (e.target.checked) setChallanTypes(prev => [...prev, type]);
                          else setChallanTypes(prev => prev.filter(t => t !== type));
                        } } />
                      {type === 'pending' ? 'Pending Challan' : 'Disposed Challan'}
                    </label>
                  ))}
                  <div style={{ textAlign: 'right', marginTop: 6, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#fff', cursor: 'pointer' }}
                      onClick={() => setChallanTypes([])}
                    >
                      Reset
                    </button>
                    <button
                      style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#f5f8fa', cursor: 'pointer' }}
                      onClick={() => setShowChallanDropdown(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right-aligned Download and Print icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <button
            title="Download"
            onClick={() => {
              setDownloadFormat('excel');
              setShowDownloadModal(true);
            } }
            style={{ background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 999, cursor: 'pointer', color: '#0d47a1', fontSize: 18, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiDownloadCloud />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Download</span>
          </button>
          <button
            title="Print Table"
            onClick={handlePrint}
            style={{ background: '#f3e5f5', border: '1px solid #e1bee7', borderRadius: 999, cursor: 'pointer', color: '#4a148c', fontSize: 18, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiPrinter />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Print</span>
          </button>
        </div>
      </div>
      <div className="table-container" id="my-fleet-table-print-area">
        <table className="latest-table vehicle-summary-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle No.</th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('rc_regn_dt')}>
                Registration Date
                <span style={{ fontSize: 13, marginLeft: 2 }}>{sortConfig.key === 'rc_regn_dt' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span>
              </th>
              <th
                style={{
                  ...(expiredTypes.includes('insurance') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}),
                  cursor: 'pointer', userSelect: 'none'
                }}
                onClick={() => handleSort('rc_insurance_upto')}
              >
                Insurance Upto
                <span style={{ fontSize: 13, marginLeft: 2 }}>{sortConfig.key === 'rc_insurance_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span>
              </th>
              <th
                style={{
                  ...(expiredTypes.includes('roadtax') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}),
                  cursor: 'pointer', userSelect: 'none'
                }}
                onClick={() => handleSort('rc_tax_upto')}
              >
                Road Tax Upto
                <span style={{ fontSize: 13, marginLeft: 2 }}>{sortConfig.key === 'rc_tax_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span>
              </th>
              <th
                style={{
                  ...(expiredTypes.includes('fitness') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}),
                  cursor: 'pointer', userSelect: 'none'
                }}
                onClick={() => handleSort('rc_fit_upto')}
              >
                Fitness Upto
                <span style={{ fontSize: 13, marginLeft: 2 }}>{sortConfig.key === 'rc_fit_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span>
              </th>
              <th
                style={{
                  ...(expiredTypes.includes('pollution') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}),
                  cursor: 'pointer', userSelect: 'none'
                }}
                onClick={() => handleSort('rc_pucc_upto')}
              >
                Pollution Upto
                <span style={{ fontSize: 13, marginLeft: 2 }}>{sortConfig.key === 'rc_pucc_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span>
              </th>
              <th colSpan={2} className="challans-header">Challans</th>
              <th>View</th>
            </tr>
            <tr>
              <th colSpan={7}></th>
              <th className="challan-sub-header" style={{ color: '#e74c3c' }}>Pending</th>
              <th className="challan-sub-header" style={{ color: '#43a047' }}>Settled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}>Loading...</td></tr>
            ) : sortedAll.length === 0 ? (
              <tr><td colSpan={10}>No data found.</td></tr>
            ) : (
              visibleRows.map((row, idx) => (
                <tr key={row.vehicle_id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {row.vehicle_number || '-'}
                    {isAllFit(row) && <BlueTickIcon />}
                  </td>
                  <td>{(row.rc_regn_dt || row.registration_date || row.registered_at) ?? 'N/A'}</td>
                  <td
                    style={expiredTypes.includes('insurance') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{(() => {
                    const val = row.rc_insurance_upto || row.insurance_exp;
                    if (val === null || val === undefined) return 'N/A';
                    if (typeof val === 'object') {
                      if (val.value === null || val.value === undefined) return 'N/A';
                      return val.value;
                    }
                    return val || 'N/A';
                  })()}</td>
                  <td
                    style={expiredTypes.includes('roadtax') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{(() => {
                    const val = row.rc_tax_upto || row.road_tax_exp;
                    if (val === null || val === undefined) return 'N/A';
                    if (typeof val === 'object') {
                      if (val.value === null || val.value === undefined) return 'N/A';
                      return val.value;
                    }
                    return val || 'N/A';
                  })()}</td>
                  <td
                    style={expiredTypes.includes('fitness') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{(() => {
                    const val = row.rc_fit_upto || row.fitness_exp;
                    if (val === null || val === undefined) return 'N/A';
                    if (typeof val === 'object') {
                      if (val.value === null || val.value === undefined) return 'N/A';
                      return val.value;
                    }
                    return val || 'N/A';
                  })()}</td>
                  <td
                    style={expiredTypes.includes('pollution') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{(() => {
                    const val = row.rc_pucc_upto || row.pollution_exp;
                    if (val === null || val === undefined) return 'N/A';
                    if (typeof val === 'object') {
                      if (val.value === null || val.value === undefined) return 'N/A';
                      return val.value;
                    }
                    return val || 'N/A';
                  })()}</td>
                  <td className={row.pending_challan_count > 0
                    ? 'pending-challan-count'
                    : 'zero-challan-count'} style={{ textAlign: 'center', fontWeight: 600 }}>{row.pending_challan_count ?? 0}</td>
                  <td className={row.disposed_challan_count > 0
                    ? 'disposed-challan-count'
                    : 'zero-challan-count'} style={{ textAlign: 'center', fontWeight: 600 }}>{row.disposed_challan_count ?? 0}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="action-btn flat-btn" title="View" style={{ fontSize: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => onView(row)}>
                      <FaEye style={{ fontSize: '1.2em' }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Show more records control to match VehicleRtoData UI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 24 }}>
          <span style={{
            color: '#1976d2',
            fontSize: 15
          }}>
            Show more records:
          </span>
          <SelectShowMore
            onShowMoreRecords={val => {
              if (val === 'all') setVisibleCount(sortedAll.length);
              else setVisibleCount(Number(val));
            } }
            onResetRecords={() => setVisibleCount(30)}
            maxCount={sortedAll.length} />
        </div>
      </div>

      {/* Download format selection modal */}
      <CustomModal
        open={showDownloadModal}
        title="Download My Fleet"
        description="Choose the format in which you want to download the fleet summary."
        confirmText={downloadFormat === 'excel' ? 'Download Excel' : 'Download PDF'}
        cancelText="Cancel"
        onConfirm={() => {
          if (downloadFormat === 'excel') {
            handleDownload(sortedAll);
          } else {
            handleDownloadPdf();
          }
          setShowDownloadModal(false);
        } }
        onCancel={() => setShowDownloadModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="download-format"
              value="excel"
              checked={downloadFormat === 'excel'}
              onChange={() => setDownloadFormat('excel')} />
            <span>Excel (.xlsx)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="download-format"
              value="pdf"
              checked={downloadFormat === 'pdf'}
              onChange={() => setDownloadFormat('pdf')} />
            <span>PDF</span>
          </label>
        </div>
      </CustomModal>
    </div></>
  );
}
