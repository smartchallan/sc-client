// Local formatExpiry function for date formatting (matches RTO details page)
const formatExpiry = (dateStr, useColor = true) => {
  if (!dateStr || dateStr === '-' || dateStr === 'NA' || dateStr === 'N/A') return '-';
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
  // Color logic can be added if needed
  return formatted;
};
import React, { useState, useEffect, useRef, useMemo } from "react";
import SelectShowMore from "./SelectShowMore";
import ClientTreeDropdown from "../components/ClientTreeDropdown";
import { FaSyncAlt, FaEye, FaUpload } from "react-icons/fa";
import { FiDownloadCloud, FiPrinter } from "react-icons/fi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import CustomModal from "./CustomModal";
import scLogo from "../assets/sc-logo.png";
import { resolvePerHostEnv, getWhitelabelHosts } from "../utils/whitelabel";

const WHITELABEL_HOSTS = getWhitelabelHosts();
const CURRENT_HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const DEFAULT_HOST = 'app.smartchallan.com';
const IS_DEFAULT_DOMAIN = CURRENT_HOSTNAME === DEFAULT_HOST;
const IS_WHITELABEL = WHITELABEL_HOSTS.includes(CURRENT_HOSTNAME) && !IS_DEFAULT_DOMAIN;
const BRAND_LOGO = (IS_WHITELABEL && resolvePerHostEnv(CURRENT_HOSTNAME, 'LOGO_URL')) || import.meta.env.VITE_CUSTOM_LOGO_URL || scLogo;
import html2canvas from "html2canvas";
import { fetchImageAsDataUrl } from "../utils/whitelabel";

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
    'Body Type': row.rc_body_type_desc || row.body_type_desc || row.body_type || '-',
    'Registration Date': row.rc_regn_dt || row.registration_date || row.registered_at,
    'Insurance Upto': typeof (row.rc_insurance_upto || row.insurance_exp) === 'object' ? (row.rc_insurance_upto || row.insurance_exp).value : (row.rc_insurance_upto || row.insurance_exp),
    'Road Tax Upto': typeof (row.rc_tax_upto || row.road_tax_exp) === 'object' ? (row.rc_tax_upto || row.road_tax_exp).value : (row.rc_tax_upto || row.road_tax_exp),
    'Fitness Upto': typeof (row.rc_fit_upto || row.fitness_exp) === 'object' ? (row.rc_fit_upto || row.fitness_exp).value : (row.rc_fit_upto || row.fitness_exp),
    'Pollution Upto': typeof (row.rc_pucc_upto || row.pollution_exp) === 'object' ? (row.rc_pucc_upto || row.pollution_exp).value : (row.rc_pucc_upto || row.pollution_exp),
    // National Permit and Permit Valid: try multiple sources and extract .value when present
    'National Permit': (() => {
      let val = row.rc_np_upto ?? row._raw?.rc_np_upto ?? row.temp_permit?.rc_np_upto ?? row._raw?.temp_permit?.rc_np_upto;
      if (!val) return '-';
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        try { val = JSON.parse(val); } catch (e) { return '-'; }
      }
      if (typeof val === 'object') {
        if ('value' in val && val.value) val = val.value; else return '-';
      }
      return formatExpiry(val, false);
    })(),
    'Permit Valid': (() => {
      let val = row.rc_permit_valid_upto ?? row._raw?.rc_permit_valid_upto ?? row.temp_permit?.rc_permit_valid_upto ?? row._raw?.temp_permit?.rc_permit_valid_upto;
      if (!val) return '-';
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        try { val = JSON.parse(val); } catch (e) { return '-'; }
      }
      if (typeof val === 'object') {
        if ('value' in val && val.value) val = val.value; else return '-';
      }
      return formatExpiry(val, false);
    })(),
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
    const uploadEnabled = import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true';
    const columnsToRemove = uploadEnabled ? 1 : 0; // Remove Upload column if enabled; View column no longer exists

    const theadRows = printTable.querySelectorAll('thead tr');
    theadRows.forEach((tr, rowIndex) => {
      const cells = tr.querySelectorAll('th');
      if (cells.length >= columnsToRemove) {
        // Remove the last header cell(s) (View and Upload columns) from all header rows for print/PDF
        for (let i = 0; i < columnsToRemove; i++) {
          tr.removeChild(cells[cells.length - 1 - i]);
        }
      }
    });

    const bodyRows = printTable.querySelectorAll('tbody tr');
    bodyRows.forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      if (cells.length >= columnsToRemove) {
        // Remove the last cell(s) (View and Upload columns) from each body row
        for (let i = 0; i < columnsToRemove; i++) {
          tr.removeChild(cells[cells.length - 1 - i]);
        }
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
  win.document.write(`<img class="sc-branding-logo" src="${BRAND_LOGO}" alt="Smart Challan Logo" />`);
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
      <img class="sc-branding-logo" style="height:36px; max-width:180px; object-fit:contain;" src="${BRAND_LOGO}" alt="Smart Challan Logo" />
      <div class="sc-branding-text">
        <p class="sc-branding-sub">My Fleet Summary</p>
      </div>
    </div>
    ${tableHtml}
  `;
  document.body.appendChild(container);
  // Give images (logo, etc.) a short time to load before capture
  setTimeout(async () => {
    try {
      const imgEl = container.querySelector('.sc-branding-logo');
      if (imgEl && imgEl.src) {
        const dataUrl = await fetchImageAsDataUrl(imgEl.src);
        if (dataUrl) imgEl.src = dataUrl;
      }
    } catch (e) {}
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
  showClientPages = false,
  initialClientId = null,
  initialVehicleSearch = null,
  onConsumeJump,
  onFetchRto,
  onFetchChallan,
  onStatusChange,
  onDelete,
  refreshKey = 0,
}) {
  // ── Column config ────────────────────────────────────────────────────────
  const ALL_COLS = [
    { key: 'vehicle_number', label: 'Vehicle No.',     icon: 'ri-roadster-line',              fixed: true },
    { key: 'body_type',      label: 'Body Type',        icon: 'ri-car-washing-line' },
    { key: 'rc_regn_dt',     label: 'Regn. Date',       icon: 'ri-calendar-check-line',        sortKey: 'rc_regn_dt' },
    { key: 'rc_insurance_upto', label: 'Insurance',     icon: 'ri-shield-check-line',          sortKey: 'rc_insurance_upto', filterKey: 'insurance' },
    { key: 'rc_tax_upto',    label: 'Road Tax',         icon: 'ri-money-rupee-circle-line',    sortKey: 'rc_tax_upto',       filterKey: 'roadtax' },
    { key: 'rc_np_upto',     label: 'Nat. Permit',      icon: 'ri-file-paper-2-line',          sortKey: 'rc_np_upto',        filterKey: 'np' },
    { key: 'rc_permit_valid_upto', label: 'State Permit', icon: 'ri-file-shield-2-line',       sortKey: 'rc_permit_valid_upto', filterKey: 'permit' },
    { key: 'rc_fit_upto',    label: 'Fitness',          icon: 'ri-heart-pulse-line',           sortKey: 'rc_fit_upto',       filterKey: 'fitness' },
    { key: 'rc_pucc_upto',   label: 'Pollution',        icon: 'ri-leaf-line',                  sortKey: 'rc_pucc_upto',      filterKey: 'pollution' },
    { key: 'pending',        label: 'Pending',          icon: 'ri-error-warning-line',         sortKey: 'pending_challan_count' },
    { key: 'settled',        label: 'Settled',          icon: 'ri-check-double-line',          sortKey: 'disposed_challan_count' },
  ];
  const DEFAULT_COL_ORDER = ALL_COLS.map(c => c.key);
  // ── Column order / visibility state ─────────────────────────────────────
  const [colOrder, setColOrder] = useState(() => {
    try { const s = localStorage.getItem('fleet_col_order'); if (s) return JSON.parse(s); } catch {}
    return DEFAULT_COL_ORDER;
  });
  const [visibleCols, setVisibleCols] = useState(() => {
    try { const s = localStorage.getItem('fleet_vis_cols'); if (s) return new Set(JSON.parse(s)); } catch {}
    return new Set(DEFAULT_COL_ORDER);
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [draggedCol, setDraggedCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [actionMenuRowId, setActionMenuRowId] = useState(null);
  const colMenuRef = useRef(null);

  // Client selection state for Client Vehicles mode
  const [selectedClient, setSelectedClient] = useState(null);
  const [networkTree, setNetworkTree] = useState([]);
  const [loadingClientVehicles, setLoadingClientVehicles] = useState(false);
  const [clientVehiclesData, setClientVehiclesData] = useState([]);

  // Derive selectedClientId from the selected client object
  const selectedClientId = selectedClient ? String(selectedClient.id) : null;

  // Load tree from localStorage when in Client Vehicles mode
  useEffect(() => {
    if (showClientPages) {
      try {
        const cachedData = localStorage.getItem('client_network');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          const tree = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.data) ? parsed.data : []);
          setNetworkTree(tree);
        }
      } catch (e) {
        console.error('Failed to load clients:', e);
      }
    }
  }, [showClientPages]);
  
  // Fetch vehicles when client is selected
  useEffect(() => {
    if (showClientPages && selectedClientId) {
      setLoadingClientVehicles(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/vehiclesummary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClientId, limit: 1000000, offset: 0 })
      })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Raw API response for client', selectedClientId, ':', data);
          let arr = [];
          if (Array.isArray(data)) arr = data;
          else if (Array.isArray(data.data)) arr = data.data;
          else if (data && Array.isArray(data.rows)) arr = data.rows;
          else if (data && Array.isArray(data.result)) arr = data.result;
          else if (data && data.data && Array.isArray(data.data.rows)) arr = data.data.rows;
          else if (data && data.data && Array.isArray(data.data.items)) arr = data.data.items;
          else if (data && Array.isArray(data.vehicles)) arr = data.vehicles;
          else if (data && typeof data === 'object') {
            for (const k of Object.keys(data)) {
              if (Array.isArray(data[k])) { arr = data[k]; break; }
            }
          }
          console.log('✅ Extracted array:', arr?.length, 'items');
          // Keep all fields from raw data and add normalized aliases
          const normalized = (arr || []).map(r => ({
            ...r, // Keep all original fields
            vehicle_id: r.vehicle_id || r.id || r._id || r.vehicleId || null,
            vehicle_number: r.vehicle_number || r.rc_regn_no || r.regn_no || r.vehicle_no || r.registration_number || r.vh_regn_no || r.reg_no || r.regn || '-',
            rc_regn_dt: r.rc_regn_dt || r.registration_date || r.registered_at || '-',
            pending_challan_count: r.pending_challan_count ?? r.pending_count ?? r.pending_challans ?? r.pending ?? 0,
            disposed_challan_count: r.disposed_challan_count ?? r.disposed_count ?? r.disposed_challans ?? r.disposed ?? 0,
            insurance_exp: r.insurance_exp || r.insuranceUpto || r.rc_insurance_upto || r.insurance_expiry || r.insuranceExpiry || '-',
            road_tax_exp: r.road_tax_exp || r.roadTaxExp || r.rc_tax_upto || r.road_tax || '-',
            fitness_exp: r.fitness_exp || r.fitnessUpto || r.rc_fit_upto || '-',
            pollution_exp: r.pollution_exp || r.pollutionUpto || r.rc_pucc_upto || '-',
            registered_at: r.registered_at || r.registeredAt || r.registration_date || r.created_at || r.createdAt || null,
            onboarded_at: r.created_at || r.createdAt || null,
            rc_body_type_desc: r.rc_body_type_desc || r.body_type_desc || r.body_type || r._raw?.rto_data?.VehicleDetails?.rc_body_type_desc || r.rto_data?.VehicleDetails?.rc_body_type_desc || '-',
            _raw: r
          }));
          console.log('✅ Normalized vehicles:', normalized?.length, 'items');
          console.log('✅ Sample vehicle:', normalized?.[0]);
          console.log('🔄 Calling setClientVehiclesData with', normalized.length, 'items');
          setClientVehiclesData(normalized);
          setLoadingClientVehicles(false);
          console.log('✅ State update calls complete - component should re-render now');
        })
        .catch((err) => {
          console.error('Failed to load client vehicles:', err);
          setClientVehiclesData([]);
          setLoadingClientVehicles(false);
        });
    } else if (showClientPages && !selectedClientId) {
      // Reset data when no client is selected
      setClientVehiclesData([]);
    }
  }, [showClientPages, selectedClientId, refreshKey]);
  
  // Use client vehicles data when in Client Vehicles mode
  const actualData = showClientPages ? clientVehiclesData : data;
  const actualLoading = showClientPages ? loadingClientVehicles : loading;
  
  // Sorting state for each date column
  const [sortConfig, setSortConfig] = useState({ key: 'rc_regn_dt', direction: 'desc' });

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
      } else if (key === 'rc_np_upto') {
        val = v.rc_np_upto || v._raw?.rc_np_upto || v.temp_permit?.rc_np_upto || v._raw?.temp_permit?.rc_np_upto;
      } else if (key === 'rc_permit_valid_upto') {
        val = v.rc_permit_valid_upto || (v.temp_permit && v.temp_permit.rc_permit_valid_upto) || v._raw?.rc_permit_valid_upto || v._raw?.temp_permit?.rc_permit_valid_upto;
      }
    }

    // If sorting numeric challan counts
    if (key === 'pending_challan_count' || key === 'disposed_challan_count') {
      const num = Number(v[key] ?? 0);
      return isNaN(num) ? 0 : num;
    }

    const d = parseFlexibleDate(val);
    return d ? d.getTime() : 0;
  };
  // Vehicle number search state
  const [vehicleNumberSearch, setVehicleNumberSearch] = useState("");

  // Auto-select client and pre-fill vehicle search when initialClientId/initialVehicleSearch are provided (master search jump)
  const flatNetworkTree = useMemo(() => {
    const flatten = (nodes, depth = 0, parentName = null) => {
      const result = [];
      for (const node of nodes) {
        result.push({ ...node, depth, parentName });
        if (node.children && node.children.length > 0) {
          result.push(...flatten(node.children, depth + 1, node.name));
        }
      }
      return result;
    };
    return flatten(networkTree);
  }, [networkTree]);

  useEffect(() => {
    if (!showClientPages || !initialClientId || flatNetworkTree.length === 0) return;
    const found = flatNetworkTree.find(c => String(c.id) === String(initialClientId));
    if (found) setSelectedClient(found);
    if (initialVehicleSearch) setVehicleNumberSearch(initialVehicleSearch);
    if (onConsumeJump) onConsumeJump();
  }, [initialClientId, initialVehicleSearch, flatNetworkTree]);

  // Expired filter: multiple types (insurance, roadtax, fitness, pollution)
  const [expiredTypes, setExpiredTypes] = useState([]); // e.g. ['insurance', 'roadtax']
  const [showExpiredDropdown, setShowExpiredDropdown] = useState(false);
  // Urgent renewals filter: multiple types and day range
  const [urgentTypes, setUrgentTypes] = useState([]); // e.g. ['insurance', 'roadtax']
  const [showUrgentDropdown, setShowUrgentDropdown] = useState(false);
  const [urgentRange, setUrgentRange] = useState(15); // days, default 15
  // Challan filter: pending/disposed
  const [challanTypes, setChallanTypes] = useState([]); // e.g. ['pending', 'disposed'] (checkboxes)
  const [challanSources, setChallanSources] = useState([]); // e.g. ['online','registered','virtual'] (dropdown)
  const [showChallanDropdown, setShowChallanDropdown] = useState(false);

  // Download format modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('excel'); // 'excel' | 'pdf'

  // Upload document modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVehicleForUpload, setSelectedVehicleForUpload] = useState(null);
  const [uploadFiles, setUploadFiles] = useState({
    insurance: null,
    pollution: null,
    roadTax: null,
    fitness: null,
    permit: null
  });

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
      if (colMenuRef.current && !colMenuRef.current.contains(event.target)) setColMenuOpen(false);
      if (actionMenuRowId !== null) {
        if (!event.target.closest?.('.vft-action-anchor')) setActionMenuRowId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuRowId]);

  // When coming from the dashboard Vehicle Renewals stat card,
  // auto-select the corresponding "expired" filter once.
  useEffect(() => {
    if (!goToFleetRenewal) return;

    const mapRenewalToExpiredType = (key) => {
      if (key === 'insurance') return 'insurance';
      if (key === 'roadTax') return 'roadtax';
      if (key === 'fitness') return 'fitness';
      if (key === 'pollution') return 'pollution';
      if (key === 'nationalPermit' || key === 'np') return 'np';
      if (key === 'permit' || key === 'permitValid') return 'permit';
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
  
  console.log('=== DATA FLOW DEBUG ===', { 
    showClientPages, 
    selectedClientId,
    clientVehiclesData: clientVehiclesData?.length, 
    actualData: actualData?.length,
    filteredFleet: filteredFleet?.length,
    willUse: (filteredFleet?.length > 0) ? 'filteredFleet' : 'actualData'
  });
  
  // Sort by selected column or registered_at DESC
  // Fix: Check if filteredFleet has items, not just if it exists (empty array is truthy!)
  let sortedAll = [...((filteredFleet?.length > 0) ? filteredFleet : (actualData || []))];
  console.log('sortedAll after spread:', sortedAll?.length);
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
        else if (type === 'np') exp = v.rc_np_upto || v._raw?.rc_np_upto || v.temp_permit?.rc_np_upto || v._raw?.temp_permit?.rc_np_upto;
        else if (type === 'permit') exp = v.rc_permit_valid_upto || (v.temp_permit && v.temp_permit.rc_permit_valid_upto) || v._raw?.rc_permit_valid_upto || v._raw?.temp_permit?.rc_permit_valid_upto;
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
        else if (type === 'np') exp = v.rc_np_upto || v._raw?.rc_np_upto || v.temp_permit?.rc_np_upto || v._raw?.temp_permit?.rc_np_upto;
        else if (type === 'permit') exp = v.rc_permit_valid_upto || (v.temp_permit && v.temp_permit.rc_permit_valid_upto) || v._raw?.rc_permit_valid_upto || v._raw?.temp_permit?.rc_permit_valid_upto;
        const d = parseFlexibleDate(exp);
        if (!d) return false;
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= urgentRange;
      });
    });
  }
  // Apply challan filter (pending/disposed)
  if (challanTypes.length > 0 || challanSources.length > 0) {
    sortedAll = sortedAll.filter(v => {
      // If there are detailed challan arrays on the vehicle raw data, prefer them
      const pendingArr = v._raw?.pending_data ?? v._raw?.challan_data?.pending_data ?? v._raw?.pending_challans ?? null;
      const disposedArr = v._raw?.disposed_data ?? v._raw?.challan_data?.disposed_data ?? v._raw?.disposed_challans ?? null;

      // Helper to normalize flags like sent_to_reg_court / sent_to_virtual_court
      const normalizeCourtFlag = (val) => {
        if (val === null || val === undefined) return null;
        const s = String(val).trim().toLowerCase();
        if (!s || s === '-' || s === 'na' || s === 'n/a') return null;
        if (s === 'no' || s === '0' || s === 'false') return false;
        return true;
      };

      const getChallanType = (c) => {
        const regRaw = c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court;
        const virtRaw = c.sent_to_virtual_court ?? c.sent_to_virtual;
        const regFlag = normalizeCourtFlag(regRaw);
        const virtFlag = normalizeCourtFlag(virtRaw);
        if (virtFlag === true) return 'virtual';
        if (regFlag === true) return 'registered';
        return 'online';
      };

      // Build candidate challan list based on selected statuses
      let candidates = [];
      if (challanTypes.length === 0) {
        // if no explicit status chosen, include both pending and disposed arrays if available
        if (Array.isArray(pendingArr)) candidates = candidates.concat(pendingArr);
        if (Array.isArray(disposedArr)) candidates = candidates.concat(disposedArr);
      } else {
        if (challanTypes.includes('pending') && Array.isArray(pendingArr)) candidates = candidates.concat(pendingArr);
        if (challanTypes.includes('disposed') && Array.isArray(disposedArr)) candidates = candidates.concat(disposedArr);
      }

      // If we have candidate challans and source filters, check types
      if (candidates.length > 0 && challanSources.length > 0) {
        return candidates.some(c => challanSources.includes(getChallanType(c)));
      }

      // If we have candidate challans but no source filter, then presence is enough
      if (candidates.length > 0 && challanSources.length === 0) {
        return candidates.length > 0;
      }

      // Fallback: if no detailed arrays, use counts and statuses
      if (challanSources.length === 0) {
        // Only status filtering requested
        let match = false;
        if (challanTypes.includes('pending') && (v.pending_challan_count ?? 0) > 0) match = true;
        if (challanTypes.includes('disposed') && (v.disposed_challan_count ?? 0) > 0) match = true;
        return match;
      }

      // If source filters selected but no detailed challans: include vehicle if it has any challan counts (best-effort)
      const totalCh = (v.pending_challan_count ?? 0) + (v.disposed_challan_count ?? 0);
      return totalCh > 0;
    });
  }
  // Default visible count is 30
  const [visibleCount, setVisibleCount] = React.useState(30);
  const visibleRows = sortedAll.slice(0, visibleCount);
  console.log('Final render data:', { sortedAllLength: sortedAll.length, visibleCount, visibleRowsLength: visibleRows.length });

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
  const selectedClientName = selectedClient?.name || 'Client';

  // Helper to extract a plain string from a date field (string or { value } object)
  const extractDateVal = (field) => {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field.value || null;
    return field || null;
  };

  // ── Column drag handlers ─────────────────────────────────────────────────
  const handleColDragStart = (e, key) => { setDraggedCol(key); e.dataTransfer.effectAllowed = 'move'; };
  const handleColDragOver  = (e, key) => { e.preventDefault(); if (key !== draggedCol) setDragOverCol(key); };
  const handleColDrop = (e, key) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === key) return;
    const next = [...colOrder];
    const fi = next.indexOf(draggedCol), ti = next.indexOf(key);
    if (fi < 0 || ti < 0) return;
    next.splice(fi, 1); next.splice(ti, 0, draggedCol);
    setColOrder(next);
    localStorage.setItem('fleet_col_order', JSON.stringify(next));
    setDraggedCol(null); setDragOverCol(null);
  };
  const handleColDragEnd = () => { setDraggedCol(null); setDragOverCol(null); };

  // ── renderCell helper ─────────────────────────────────────────────────────
  const renderCell = (row, colKey, rowId) => {
    switch (colKey) {
      case 'vehicle_number': {
        const hasMultiOffice = (
          row._isFallback || !row.rc_owner_name || row.rc_owner_name === '-'
        ) && (() => {
          const msg = row._statusMessage || row.stautsMessage || row.statusMessage || row.status_message
            || row._raw?.rto_data?.VehicleDetails?.stautsMessage
            || row._raw?.rto_data?.VehicleDetails?.statusMessage
            || row._raw?.rto_data?.VehicleDetails?.status_message;
          return typeof msg === 'string' && msg.includes('Vehicle Record found in more than one office');
        })();
        return (
          <div className="vft-vnum-wrap">
            {hasMultiOffice && (
              <span title="Vehicle record found in more than one office" style={{ marginRight: 4, color: '#ff9800' }}>
                <i className="ri-error-warning-line" />
              </span>
            )}
            <span className="vst-vehicle-num" onClick={() => onView(row)} title="Click to view details">
              {row.vehicle_number || '-'}
              <i className="ri-external-link-line vst-vehicle-num__icon" />
            </span>
            <div
              className="vft-action-anchor"
              onClick={e => e.stopPropagation()}
              onMouseEnter={() => setActionMenuRowId(rowId)}
              onMouseLeave={() => setActionMenuRowId(null)}
            >
              <button className="vft-kebab-btn" title="Actions">
                <i className="ri-more-2-fill" />
              </button>
              {actionMenuRowId === rowId && (
                <div className="vft-action-menu">
                  <button onClick={() => { onView(row); setActionMenuRowId(null); }}>
                    <i className="ri-eye-line" /> View Details
                  </button>
                  <div className="vft-action-menu__divider" />
                  <button onClick={() => { onStatusChange?.(row); setActionMenuRowId(null); }}>
                    <i className={(row.status || '').toUpperCase() === 'ACTIVE' ? 'ri-pause-circle-line' : 'ri-checkbox-circle-line'} />
                    {(row.status || '').toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="vft-action-menu__item--danger" onClick={() => { onDelete?.(row); setActionMenuRowId(null); }}>
                    <i className="ri-delete-bin-6-line" /> Delete Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'body_type':
        return row.rc_body_type_desc || row.body_type_desc || row.body_type || row._raw?.rto_data?.VehicleDetails?.rc_body_type_desc || '-';
      case 'rc_regn_dt': {
        const regnRaw = row.rc_regn_dt || row.registration_date || row.registered_at;
        return regnRaw ? formatExpiry(regnRaw, false) : <span style={{ color: '#94a3b8' }}>—</span>;
      }
      case 'rc_insurance_upto':
        return renderDateCell(extractDateVal(row.rc_insurance_upto || row.insurance_exp));
      case 'rc_tax_upto':
        return renderDateCell(extractDateVal(row.rc_tax_upto || row.road_tax_exp));
      case 'rc_np_upto': {
        let val = row.rc_np_upto ?? row._raw?.rc_np_upto ?? row.temp_permit?.rc_np_upto ?? row._raw?.temp_permit?.rc_np_upto;
        if (!val) return renderDateCell(null);
        if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
          try { val = JSON.parse(val); } catch { return renderDateCell(null); }
        }
        if (typeof val === 'object') { if ('value' in val && val.value) val = val.value; else return renderDateCell(null); }
        return renderDateCell(formatExpiry(String(val), false));
      }
      case 'rc_permit_valid_upto': {
        let val = row.rc_permit_valid_upto ?? row._raw?.rc_permit_valid_upto ?? row.temp_permit?.rc_permit_valid_upto ?? row._raw?.temp_permit?.rc_permit_valid_upto;
        if (!val) return renderDateCell(null);
        if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
          try { val = JSON.parse(val); } catch { return renderDateCell(null); }
        }
        if (typeof val === 'object') { if ('value' in val && val.value) val = val.value; else return renderDateCell(null); }
        return renderDateCell(formatExpiry(String(val), false));
      }
      case 'rc_fit_upto':
        return renderDateCell(extractDateVal(row.rc_fit_upto || row.fitness_exp));
      case 'rc_pucc_upto':
        return renderDateCell(extractDateVal(row.rc_pucc_upto || row.pollution_exp));
      case 'pending':
        return <span className={`vst-badge ${row.pending_challan_count > 0 ? 'vst-badge--pending' : 'vst-badge--zero'}`}>{row.pending_challan_count ?? 0}</span>;
      case 'settled':
        return <span className={`vst-badge ${row.disposed_challan_count > 0 ? 'vst-badge--settled' : 'vst-badge--zero'}`}>{row.disposed_challan_count ?? 0}</span>;
      default:
        return '-';
    }
  };

  const getTdStyle = (colKey) => {
    const fk = ALL_COLS.find(c => c.key === colKey)?.filterKey;
    if (fk && (expiredTypes.includes(fk) || urgentTypes.includes(fk))) return { background: '#e3f2fd', fontWeight: 600 };
    if (colKey === 'pending' || colKey === 'settled') return { textAlign: 'center' };
    return {};
  };

  // Render a date cell with color coding: red=expired, amber=expiring within 30d, green=valid
  const renderDateCell = (val) => {
    if (!val || val === 'N/A' || val === '-') return <span style={{ color: '#94a3b8' }}>—</span>;
    const d = parseFlexibleDate(val);
    let cls = 'vst-date';
    if (d) {
      const daysLeft = (d - new Date()) / (1000 * 60 * 60 * 24);
      if (daysLeft < 0) cls += ' vst-date--expired';
      else if (daysLeft <= 30) cls += ' vst-date--expiring';
      else cls += ' vst-date--valid';
    }
    return <span className={cls}>{val}</span>;
  };

  return (
    <>
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Full-page loader when fetching client vehicles */}
      {showClientPages && loadingClientVehicles && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '48px 56px',
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 12px 48px rgba(33, 150, 243, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '2px solid #2196f3',
            minWidth: 380,
            maxWidth: 480
          }}>
            <div style={{
              width: 72,
              height: 72,
              border: '5px solid #e3f2fd',
              borderTop: '5px solid #2196f3',
              borderRadius: '50%',
              animation: 'spin 0.9s linear infinite',
              margin: '0 auto 28px'
            }} />
            <div style={{ 
              fontSize: 22, 
              fontWeight: 600, 
              color: '#1565c0', 
              marginBottom: 10,
              letterSpacing: '-0.3px',
              lineHeight: 1.3
            }}>
              Fetching vehicles for {selectedClientName}
            </div>
            <div style={{ 
              fontSize: 15, 
              color: '#666',
              fontWeight: 400,
              lineHeight: 1.5
            }}>
              Please wait...
            </div>
          </div>
        </div>
      )}
      
      <p className="page-subtitle">
        {showClientPages 
          ? "Select a client to view their vehicles. Track expired vehicles, upcoming renewals, and challan statuses." 
          : "Quick summary for your fleet. Track your expired vehicles, upcoming renewals, and challan statuses."
        }
      </p>
      
      {/* Client selector dropdown for Client Vehicles mode */}
      {showClientPages && (
        <div style={{ marginBottom: 20, maxWidth: 650 }}>
          <ClientTreeDropdown
            networkTree={networkTree}
            loading={false}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
            label="Select Client"
            placeholder="Search by name, company, or email..."
            maxHeight={360}
          />
        </div>
      )}
      
      <div className="vst-card">
      <div className="vst-header">
        <div className="vst-header__left">
          <div className="vst-header__icon-box">
            <i className="ri-truck-line" />
          </div>
          <div>
            <h2 className="vst-header__title">{showClientPages ? 'Client Vehicles' : 'My Fleet'}</h2>
            <span className="vst-header__count">{sortedAll.length} vehicles</span>
          </div>
        </div>
        <div className="vst-header__actions">
          <span className="vst-record-badge">Showing {visibleRows.length} of {sortedAll.length}</span>
        </div>
      </div>
      <div className="vst-toolbar">
        <div className="vst-toolbar__left">
          <div className="vst-search-wrap">
            <i className="ri-search-line vst-search-wrap__icon" />
            <input
              type="text"
              placeholder="Search vehicle number…"
              value={vehicleNumberSearch}
              onChange={e => setVehicleNumberSearch(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="vst-search-input"
              maxLength={12}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Expired records filter */}
            <div style={{ position: 'relative' }} ref={expiredDropdownRef}>
              <button
                className={`vst-filter-trigger${expiredTypes.length > 0 ? ' vst-filter-trigger--active' : ''}${showExpiredDropdown ? ' vst-filter-trigger--open' : ''}`}
                onClick={() => setShowExpiredDropdown(v => !v)}
              >
                <i className="ri-error-warning-line vst-filter-trigger__icon" />
                {expiredTypes.length === 0 ? 'Expired records' : expiredTypes.map(t => {
                  if (t === 'insurance') return 'Insurance';
                  if (t === 'roadtax') return 'Road Tax';
                  if (t === 'fitness') return 'Fitness';
                  if (t === 'pollution') return 'Pollution';
                  if (t === 'np') return 'National Permit';
                  if (t === 'permit') return 'Permit Valid';
                  return t;
                }).join(', ')}
                {expiredTypes.length > 0 && (
                  <span className="vst-filter-trigger__badge">{expiredTypes.length}</span>
                )}
                <i className="ri-arrow-down-s-line vst-filter-trigger__chevron" />
              </button>
              {showExpiredDropdown && (
                <div className="vst-dropdown">
                  {['insurance', 'roadtax', 'fitness', 'pollution', 'np', 'permit'].map(type => (
                    <label key={type} className="vst-dropdown__option">
                      <input
                        type="checkbox"
                        checked={expiredTypes.includes(type)}
                        onChange={e => {
                          setUrgentTypes([]);
                          setChallanTypes([]);
                          if (e.target.checked) setExpiredTypes(prev => [...prev, type]);
                          else setExpiredTypes(prev => prev.filter(t => t !== type));
                        } } />
                      {type === 'insurance' ? 'Insurance' : type === 'roadtax' ? 'Road Tax' : type === 'np' ? 'National Permit' : type === 'permit' ? 'Permit Valid' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                  <div className="vst-dropdown__footer">
                    <button className="vst-dropdown__footer-btn" onClick={() => setExpiredTypes([])}>Reset</button>
                    <button className="vst-dropdown__footer-btn" onClick={() => setShowExpiredDropdown(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
            {/* Urgent renewals filter */}
            <div style={{ position: 'relative' }} ref={urgentDropdownRef}>
              <button
                className={`vst-filter-trigger${urgentTypes.length > 0 ? ' vst-filter-trigger--active' : ''}${showUrgentDropdown ? ' vst-filter-trigger--open' : ''}`}
                onClick={() => setShowUrgentDropdown(v => !v)}
              >
                <i className="ri-alarm-warning-line vst-filter-trigger__icon" />
                {urgentTypes.length === 0 ? 'Urgent renewals' : urgentTypes.map(t => {
                  if (t === 'insurance') return 'Insurance';
                  if (t === 'roadtax') return 'Road Tax';
                  if (t === 'fitness') return 'Fitness';
                  if (t === 'pollution') return 'Pollution';
                  if (t === 'np') return 'National Permit';
                  if (t === 'permit') return 'Permit Valid';
                  return t;
                }).join(', ')}
                {urgentTypes.length > 0 && (
                  <span className="vst-filter-trigger__badge">{urgentTypes.length}</span>
                )}
                <i className="ri-arrow-down-s-line vst-filter-trigger__chevron" />
              </button>
              {showUrgentDropdown && (
                <div className="vst-dropdown">
                  {['insurance', 'roadtax', 'fitness', 'pollution', 'np', 'permit'].map(type => (
                    <label key={type} className="vst-dropdown__option">
                      <input
                        type="checkbox"
                        checked={urgentTypes.includes(type)}
                        onChange={e => {
                          setExpiredTypes([]);
                          setChallanTypes([]);
                          if (e.target.checked) setUrgentTypes(prev => [...prev, type]);
                          else setUrgentTypes(prev => prev.filter(t => t !== type));
                        } } />
                      {type === 'insurance' ? 'Insurance' : type === 'roadtax' ? 'Road Tax' : type === 'np' ? 'National Permit' : type === 'permit' ? 'Permit Valid' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                  <div className="vst-range-row">
                    <span>Days:</span>
                    <input type="range" min={1} max={50} value={urgentRange} onChange={e => setUrgentRange(Number(e.target.value))} />
                    <span className="vst-range-row__value">{urgentRange}</span>
                  </div>
                  <div className="vst-dropdown__footer">
                    <button className="vst-dropdown__footer-btn" onClick={() => { setUrgentTypes([]); setUrgentRange(15); }}>Reset</button>
                    <button className="vst-dropdown__footer-btn" onClick={() => setShowUrgentDropdown(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
            {/* Challan status checkboxes (Pending / Disposed) */}
            <div className="vst-checkbox-group">
              <label className={`vst-checkbox-label${challanTypes.includes('pending') ? ' vst-checkbox-label--checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={challanTypes.includes('pending')}
                  onChange={e => {
                    setExpiredTypes([]);
                    setUrgentTypes([]);
                    if (e.target.checked) setChallanTypes(prev => Array.from(new Set([...prev, 'pending'])));
                    else setChallanTypes(prev => prev.filter(t => t !== 'pending'));
                  }}
                />
                Pending
              </label>
              <label className={`vst-checkbox-label${challanTypes.includes('disposed') ? ' vst-checkbox-label--checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={challanTypes.includes('disposed')}
                  onChange={e => {
                    setExpiredTypes([]);
                    setUrgentTypes([]);
                    if (e.target.checked) setChallanTypes(prev => Array.from(new Set([...prev, 'disposed'])));
                    else setChallanTypes(prev => prev.filter(t => t !== 'disposed'));
                  }}
                />
                Disposed
              </label>
            </div>

            {/* Challan type dropdown (Online / Registered Court / Virtual Court) */}
            <div style={{ position: 'relative' }} ref={challanDropdownRef}>
              <button
                className={`vst-filter-trigger${challanSources.length > 0 ? ' vst-filter-trigger--active' : ''}${showChallanDropdown ? ' vst-filter-trigger--open' : ''}`}
                onClick={() => setShowChallanDropdown(v => !v)}
              >
                <i className="ri-git-branch-line vst-filter-trigger__icon" />
                {challanSources.length === 0 ? 'Challan type' : challanSources.map(t => t === 'online' ? 'Online' : t === 'registered' ? 'Reg. Court' : t === 'virtual' ? 'Virtual Court' : t).join(', ')}
                {challanSources.length > 0 && (
                  <span className="vst-filter-trigger__badge">{challanSources.length}</span>
                )}
                <i className="ri-arrow-down-s-line vst-filter-trigger__chevron" />
              </button>
              {showChallanDropdown && (
                <div className="vst-dropdown">
                  {['online', 'registered', 'virtual'].map(type => (
                    <label key={type} className="vst-dropdown__option">
                      <input
                        type="checkbox"
                        checked={challanSources.includes(type)}
                        onChange={e => {
                          if (e.target.checked) setChallanSources(prev => [...prev, type]);
                          else setChallanSources(prev => prev.filter(t => t !== type));
                        }} />
                      {type === 'online' ? 'Online' : type === 'registered' ? 'Registered Court' : 'Virtual Court'}
                    </label>
                  ))}
                  <div className="vst-dropdown__footer">
                    <button className="vst-dropdown__footer-btn" onClick={() => setChallanSources([])}>Reset</button>
                    <button className="vst-dropdown__footer-btn" onClick={() => setShowChallanDropdown(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
            {/* Columns control */}
            <div style={{ position: 'relative' }} ref={colMenuRef}>
              <button
                className={`vst-filter-trigger${colMenuOpen ? ' vst-filter-trigger--open' : ''}`}
                title="Show/hide columns"
                onClick={() => setColMenuOpen(v => !v)}
              >
                <i className="ri-layout-column-line vst-filter-trigger__icon" /> Columns
                <i className="ri-arrow-down-s-line vst-filter-trigger__chevron" />
              </button>
            {colMenuOpen && (
              <div className="vft-col-menu">
                <div className="vft-col-menu__header">
                  <span>Columns</span>
                  <button onClick={() => {
                    setColOrder(DEFAULT_COL_ORDER);
                    setVisibleCols(new Set(DEFAULT_COL_ORDER));
                    localStorage.removeItem('fleet_col_order');
                    localStorage.removeItem('fleet_vis_cols');
                  }}>Reset</button>
                </div>
                {colOrder.map(key => {
                  const col = ALL_COLS.find(c => c.key === key);
                  if (!col) return null;
                  return (
                    <div
                      key={key}
                      className={`vft-col-menu__row${dragOverCol === key ? ' vft-col-menu__row--over' : ''}`}
                      draggable
                      onDragStart={e => handleColDragStart(e, key)}
                      onDragOver={e => handleColDragOver(e, key)}
                      onDrop={e => handleColDrop(e, key)}
                      onDragEnd={handleColDragEnd}
                    >
                      <i className="ri-draggable vft-col-menu__grip" />
                      <label className="vft-col-menu__label">
                        <input
                          type="checkbox"
                          checked={visibleCols.has(key)}
                          disabled={!!col.fixed}
                          onChange={e => {
                            const next = new Set(visibleCols);
                            if (e.target.checked) next.add(key); else next.delete(key);
                            setVisibleCols(next);
                            localStorage.setItem('fleet_vis_cols', JSON.stringify([...next]));
                          }}
                        />
                        <i className={col.icon} style={{ fontSize: 13, color: '#64748b', marginLeft: 6 }} />
                        <span>{col.label}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
        <div className="vst-toolbar__right">
          <button className="vst-action-btn vst-action-btn--download" title="Download" onClick={() => { setDownloadFormat('excel'); setShowDownloadModal(true); }}>
            <i className="ri-download-cloud-2-line" /> <span>Download</span>
          </button>
          <button className="vst-action-btn vst-action-btn--print" title="Print Table" onClick={handlePrint}>
            <i className="ri-printer-line" /> <span>Print</span>
          </button>
        </div>
      </div>
      <div className="vst-table-wrap" id="my-fleet-table-print-area">
        <table className="vst-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th className="vst-th--num">#</th>
              {colOrder.filter(k => visibleCols.has(k)).map(colKey => {
                const col = ALL_COLS.find(c => c.key === colKey);
                if (!col) return null;
                const isSorted = sortConfig.key === col.sortKey;
                const isHighlighted = col.filterKey && (expiredTypes.includes(col.filterKey) || urgentTypes.includes(col.filterKey));
                return (
                  <th
                    key={colKey}
                    draggable
                    className={[
                      col.sortKey ? 'vst-th--sortable' : '',
                      isSorted ? 'vst-th--sorted' : '',
                      isHighlighted ? 'vst-th--highlighted' : '',
                      dragOverCol === colKey ? 'vft-th--drag-over' : '',
                    ].filter(Boolean).join(' ')}
                    onDragStart={e => handleColDragStart(e, colKey)}
                    onDragOver={e => handleColDragOver(e, colKey)}
                    onDrop={e => handleColDrop(e, colKey)}
                    onDragEnd={handleColDragEnd}
                    onClick={col.sortKey ? () => handleSort(col.sortKey) : undefined}
                    style={col.sortKey ? { cursor: 'pointer' } : {}}
                  >
                    <span className="vft-th-inner">
                      <i className={`${col.icon} vft-th-icon`} />
                      {col.label}
                      {col.sortKey && (
                        <em className="vst-sort-icon">{isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
                      )}
                      <i className="ri-draggable vft-th-drag" title="Drag to reorder" onClick={e => e.stopPropagation()} />
                    </span>
                  </th>
                );
              })}
              {import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' && <th>Upload</th>}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const dynColSpan = colOrder.filter(k => visibleCols.has(k)).length + 1 + (import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' ? 1 : 0);
              if (actualLoading) return <tr><td colSpan={dynColSpan}>Loading...</td></tr>;
              if (showClientPages && !selectedClientId) return <tr><td colSpan={dynColSpan} style={{ textAlign: 'center', padding: 24, color: '#666' }}>Please select a client from the dropdown above to view their vehicles.</td></tr>;
              if (sortedAll.length === 0) return <tr><td colSpan={dynColSpan}>No data found.</td></tr>;
              return visibleRows.map((row, idx) => {
                const rowId = row.vehicle_id || row.vehicle_number || idx;
                return (
                  <tr key={rowId} className="vst-row">
                    <td>{idx + 1}</td>
                    {colOrder.filter(k => visibleCols.has(k)).map(colKey => (
                      <td
                        key={colKey}
                        className={colKey === 'vehicle_number' ? 'vst-td--vehicle' : (colKey === 'pending' || colKey === 'settled' ? 'vst-td--center' : '')}
                        style={getTdStyle(colKey)}
                      >
                        {renderCell(row, colKey, rowId)}
                      </td>
                    ))}
                    {import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="action-btn flat-btn"
                          title="Upload Documents"
                          style={{ fontSize: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => { setSelectedVehicleForUpload(row); setShowUploadModal(true); }}
                        >
                          <FaUpload style={{ fontSize: '1.2em' }} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
        {/* Show more records control to match VehicleRtoData UI */}
        <div className="vst-show-more">
          <span className="vst-show-more__label">Show more records:</span>
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

      {/* Upload document modal */}
      <CustomModal
        open={showUploadModal}
        title="Upload Vehicle Documents"
        description={selectedVehicleForUpload ? `Upload documents for ${selectedVehicleForUpload.vehicle_number}` : "Upload vehicle documents"}
        confirmText="Upload Documents"
        cancelText="Cancel"
        onConfirm={() => {
          // TODO: Implement file upload API call
          console.log('Uploading documents:', uploadFiles);
          setShowUploadModal(false);
          setUploadFiles({
            insurance: null,
            pollution: null,
            roadTax: null,
            fitness: null,
            permit: null
          });
        }}
        onCancel={() => {
          setShowUploadModal(false);
          setUploadFiles({
            insurance: null,
            pollution: null,
            roadTax: null,
            fitness: null,
            permit: null
          });
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Insurance Document</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFiles({ ...uploadFiles, insurance: e.target.files[0] })}
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
            />
            {uploadFiles.insurance && (
              <span style={{ fontSize: 12, color: '#666' }}>Selected: {uploadFiles.insurance.name}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Pollution Certificate (PUC)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFiles({ ...uploadFiles, pollution: e.target.files[0] })}
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
            />
            {uploadFiles.pollution && (
              <span style={{ fontSize: 12, color: '#666' }}>Selected: {uploadFiles.pollution.name}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Road Tax Document</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFiles({ ...uploadFiles, roadTax: e.target.files[0] })}
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
            />
            {uploadFiles.roadTax && (
              <span style={{ fontSize: 12, color: '#666' }}>Selected: {uploadFiles.roadTax.name}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Fitness Certificate</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFiles({ ...uploadFiles, fitness: e.target.files[0] })}
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
            />
            {uploadFiles.fitness && (
              <span style={{ fontSize: 12, color: '#666' }}>Selected: {uploadFiles.fitness.name}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Permit Document</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFiles({ ...uploadFiles, permit: e.target.files[0] })}
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
            />
            {uploadFiles.permit && (
              <span style={{ fontSize: 12, color: '#666' }}>Selected: {uploadFiles.permit.name}</span>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Accepted formats: PDF, JPG, PNG
          </div>
        </div>
      </CustomModal>
    </div></>
  );
}
