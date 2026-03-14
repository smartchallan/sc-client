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
import React, { useState, useEffect, useRef } from "react";
import SelectShowMore from "./SelectShowMore";
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
    const columnsToRemove = uploadEnabled ? 2 : 1; // Remove View and Upload if enabled, else just View

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
}) {
  // Client selection state for Client Vehicles mode
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientList, setClientList] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [loadingClientVehicles, setLoadingClientVehicles] = useState(false);
  const [clientVehiclesData, setClientVehiclesData] = useState([]);
  const clientDropdownRef = useRef(null);
  
  // Load clients from localStorage when in Client Vehicles mode
  useEffect(() => {
    if (showClientPages) {
      try {
        const cachedData = localStorage.getItem('client_network');
        if (cachedData) {
          const data = JSON.parse(cachedData);
          const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
          
          // Flatten nested children
          const flattenChildren = (node, dealerName = null) => {
            const result = [];
            result.push({ ...node, dealerName, isParent: !dealerName });
            if (Array.isArray(node.children) && node.children.length > 0) {
              node.children.forEach(child => {
                result.push(...flattenChildren(child, node.name));
              });
            }
            return result;
          };
          
          const flatClients = [];
          rawData.forEach(parent => {
            flatClients.push(...flattenChildren(parent));
          });
          
          setClientList(flatClients);
        }
      } catch (e) {
        console.error('Failed to load clients:', e);
      }
    }
  }, [showClientPages]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  }, [showClientPages, selectedClientId]);
  
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
  // Get selected client name for loader
  const selectedClient = clientList.find(c => (c.id || c._id) === selectedClientId);
  const selectedClientName = selectedClient?.name || 'Client';

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
        <div style={{ marginBottom: 20, padding: '0 0'}}>
          <div style={{ position: 'relative', maxWidth: 650 }} ref={clientDropdownRef}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600, 
              color: '#1565c0', 
              fontSize: 15,
              letterSpacing: '-0.2px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Select Client
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name, company, or email..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                onFocus={() => setShowClientDropdown(true)}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 18px',
                  border: '2px solid #2196f3',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(33, 150, 243, 0.08)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = '#1976d2'}
                onMouseLeave={(e) => e.target.style.borderColor = '#2196f3'}
              />
              {clientSearchTerm && (
                <button
                  onClick={() => {
                    setClientSearchTerm('');
                    setSelectedClientId(null);
                    setShowClientDropdown(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#e3f2fd',
                    color: '#1565c0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#1565c0';
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#e3f2fd';
                    e.target.style.color = '#1565c0';
                  }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {showClientDropdown && clientList.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                maxHeight: 360,
                overflowY: 'auto',
                background: '#fff',
                border: '2px solid #2196f3',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2), 0 2px 8px rgba(0, 0, 0, 0.08)',
                zIndex: 1000,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {clientList
                  .filter(client => {
                    const searchLower = clientSearchTerm.toLowerCase();
                    const name = client.name || '';
                    const email = client.email || '';
                    const company = (client.user_meta || client.userMeta)?.company_name || '';
                    return name.toLowerCase().includes(searchLower) || 
                           email.toLowerCase().includes(searchLower) ||
                           company.toLowerCase().includes(searchLower);
                  })
                  .map(client => (
                    <div
                      key={client.id || client._id}
                      onClick={() => {
                        setSelectedClientId(client.id || client._id);
                        setClientSearchTerm(`${client.name} (${(client.user_meta || client.userMeta)?.company_name || 'N/A'})`);
                        setShowClientDropdown(false);
                      }}
                      style={{
                        padding: '14px 18px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e8f4fd',
                        background: (client.id || client._id) === selectedClientId ? '#e3f2fd' : '#fff',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientId ? '#bbdefb' : '#f5f9fc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientId ? '#e3f2fd' : '#fff'}
                    >
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#1565c0', 
                        fontSize: 15,
                        marginBottom: 4,
                        letterSpacing: '-0.2px'
                      }}>{client.name}</div>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#666', 
                        lineHeight: 1.4
                      }}>
                        {(client.user_meta || client.userMeta)?.company_name || 'N/A'} • {client.email || 'N/A'}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
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
          <div style={{ width: 350 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                placeholder="Search Vehicle Number"
                value={vehicleNumberSearch}
                onChange={e => setVehicleNumberSearch(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="number-plate-input"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', transition: 'all 0.2s' }}
                maxLength={12} />
            </div>
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
              <th>Vehicle No.</th>
              <th>Body Type</th>
              <th className={`vst-th--sortable${sortConfig.key === 'rc_regn_dt' ? ' vst-th--sorted' : ''}`} onClick={() => handleSort('rc_regn_dt')}>
                Registration Date
                <em className="vst-sort-icon">{sortConfig.key === 'rc_regn_dt' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable${sortConfig.key === 'rc_insurance_upto' ? ' vst-th--sorted' : ''}${expiredTypes.includes('insurance') ? ' vst-th--highlighted' : ''}`}
                onClick={() => handleSort('rc_insurance_upto')}
              >
                Insurance Upto
                <em className="vst-sort-icon">{sortConfig.key === 'rc_insurance_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable${sortConfig.key === 'rc_tax_upto' ? ' vst-th--sorted' : ''}${expiredTypes.includes('roadtax') ? ' vst-th--highlighted' : ''}`}
                onClick={() => handleSort('rc_tax_upto')}
              >
                Road Tax Upto
                <em className="vst-sort-icon">{sortConfig.key === 'rc_tax_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable${sortConfig.key === 'rc_np_upto' ? ' vst-th--sorted' : ''}${(expiredTypes.includes('np') || urgentTypes.includes('np')) ? ' vst-th--highlighted' : ''}`}
                onClick={() => handleSort('rc_np_upto')}
              >
                National Permit
                <em className="vst-sort-icon">{sortConfig.key === 'rc_np_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable${sortConfig.key === 'rc_permit_valid_upto' ? ' vst-th--sorted' : ''}${(expiredTypes.includes('permit') || urgentTypes.includes('permit')) ? ' vst-th--highlighted' : ''}`}
                onClick={() => handleSort('rc_permit_valid_upto')}
              >
                Permit Valid
                <em className="vst-sort-icon">{sortConfig.key === 'rc_permit_valid_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable${sortConfig.key === 'rc_fit_upto' ? ' vst-th--sorted' : ''}${expiredTypes.includes('fitness') ? ' vst-th--highlighted' : ''}`}
                onClick={() => handleSort('rc_fit_upto')}
              >
                Fitness Upto
                <em className="vst-sort-icon">{sortConfig.key === 'rc_fit_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable${sortConfig.key === 'rc_pucc_upto' ? ' vst-th--sorted' : ''}${expiredTypes.includes('pollution') ? ' vst-th--highlighted' : ''}`}
                onClick={() => handleSort('rc_pucc_upto')}
              >
                Pollution Upto
                <em className="vst-sort-icon">{sortConfig.key === 'rc_pucc_upto' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th colSpan={2} className="challans-header">Challans</th>
              <th>View</th>
              {import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' && (
                <th>Upload Docs</th>
              )}
            </tr>
            <tr>
              <th colSpan={10}></th>
              <th
                className={`vst-th--sortable vst-th--center${sortConfig.key === 'pending_challan_count' ? ' vst-th--sorted' : ''}`}
                style={{ color: '#dc2626' }}
                onClick={() => handleSort('pending_challan_count')}
              >
                Pending
                <em className="vst-sort-icon">{sortConfig.key === 'pending_challan_count' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th
                className={`vst-th--sortable vst-th--center${sortConfig.key === 'disposed_challan_count' ? ' vst-th--sorted' : ''}`}
                style={{ color: '#16a34a' }}
                onClick={() => handleSort('disposed_challan_count')}
              >
                Settled
                <em className="vst-sort-icon">{sortConfig.key === 'disposed_challan_count' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</em>
              </th>
              <th></th>
              {import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' && (
                <th></th>
              )}
            </tr>
          </thead>
          <tbody>
            {actualLoading ? (
              <tr><td colSpan={import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' ? 14 : 13}>Loading...</td></tr>
            ) : showClientPages && !selectedClientId ? (
              <tr><td colSpan={import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' ? 14 : 13} style={{ textAlign: 'center', padding: 24, color: '#666' }}>Please select a client from the dropdown above to view their vehicles.</td></tr>
            ) : sortedAll.length === 0 ? (
              <tr><td colSpan={import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' ? 14 : 13}>No data found.</td></tr>
            ) : (
              visibleRows.map((row, idx) => (
                <tr key={row.vehicle_id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {( (
                      row._isFallback || !row.rc_owner_name || row.rc_owner_name === '-' || !row.rc_chasi_no || row.rc_chasi_no === '-'
                    ) && (
                      (row._statusMessage || row.stautsMessage || row.statusMessage || row.status_message) ||
                      (row._raw && row._raw.rto_data && row._raw.rto_data.VehicleDetails && (row._raw.rto_data.VehicleDetails.stautsMessage || row._raw.rto_data.VehicleDetails.statusMessage || row._raw.rto_data.VehicleDetails.status_message))
                    ) && typeof ((row._statusMessage || row.stautsMessage || row.statusMessage || row.status_message) || (row._raw && row._raw.rto_data && row._raw.rto_data.VehicleDetails && (row._raw.rto_data.VehicleDetails.stautsMessage || row._raw.rto_data.VehicleDetails.statusMessage || row._raw.rto_data.VehicleDetails.status_message))) === 'string' && ((row._statusMessage || row.stautsMessage || row.statusMessage || row.status_message) || (row._raw && row._raw.rto_data && row._raw.rto_data.VehicleDetails && (row._raw.rto_data.VehicleDetails.stautsMessage || row._raw.rto_data.VehicleDetails.statusMessage || row._raw.rto_data.VehicleDetails.status_message))).includes('Vehicle Record found in more than one office')) && (
                      <span title="Vehicle record found in more than one office" style={{ marginRight: 8, color: '#ff9800' }}>
                        <i className="ri-error-warning-line"></i>
                      </span>
                    )}
                    {row.vehicle_number || '-'}
                  </td>
                  <td>{row.rc_body_type_desc || row.body_type_desc || row.body_type || row._raw?.rto_data?.VehicleDetails?.rc_body_type_desc || row.rto_data?.VehicleDetails?.rc_body_type_desc || '-'}</td>
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
                  <td style={(expiredTypes.includes('np') || urgentTypes.includes('np')) ? { background: '#e3f2fd', fontWeight: 600 } : {}}>{(() => {
                    // Always extract .value if object or stringified object, else show '-'
                    let val = row.rc_np_upto ?? row._raw?.rc_np_upto ?? row.temp_permit?.rc_np_upto ?? row._raw?.temp_permit?.rc_np_upto;
                    if (!val) return '-';
                    if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
                      try {
                        val = JSON.parse(val);
                      } catch (e) { return '-'; }
                    }
                    if (typeof val === 'object') {
                      if ('value' in val && val.value) val = val.value;
                      else return '-';
                    }
                    if (!val || typeof val !== 'string') return '-';
                    return formatExpiry(val, true);
                  })()}</td>
                  <td style={(expiredTypes.includes('permit') || urgentTypes.includes('permit')) ? { background: '#e3f2fd', fontWeight: 600 } : {}}>{(() => {
                    // Always extract .value if object or stringified object, else show '-'
                    let val = row.rc_permit_valid_upto ?? row._raw?.rc_permit_valid_upto ?? row.temp_permit?.rc_permit_valid_upto ?? row._raw?.temp_permit?.rc_permit_valid_upto;
                    if (!val) return '-';
                    if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
                      try {
                        val = JSON.parse(val);
                      } catch (e) { return '-'; }
                    }
                    if (typeof val === 'object') {
                      if ('value' in val && val.value) val = val.value;
                      else return '-';
                    }
                    if (!val || typeof val !== 'string') return '-';
                    return formatExpiry(val, true);
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
                  <td className="vst-td--center"><span className={`vst-badge ${row.pending_challan_count > 0 ? 'vst-badge--pending' : 'vst-badge--zero'}`}>{row.pending_challan_count ?? 0}</span></td>
                  <td className="vst-td--center"><span className={`vst-badge ${row.disposed_challan_count > 0 ? 'vst-badge--settled' : 'vst-badge--zero'}`}>{row.disposed_challan_count ?? 0}</span></td>
                  <td className="vst-td--center">
                    <button className="vst-view-btn" title="View" onClick={() => onView(row)}>
                      <i className="ri-eye-line" />
                    </button>
                  </td>
                  {import.meta.env.VITE_VEHICLE_DOCUMENT_UPLOAD_ENABLED === 'true' && (
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="action-btn flat-btn" 
                        title="Upload Documents" 
                        style={{ fontSize: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={() => {
                          setSelectedVehicleForUpload(row);
                          setShowUploadModal(true);
                        }}
                      >
                        <FaUpload style={{ fontSize: '1.2em' }} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
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
