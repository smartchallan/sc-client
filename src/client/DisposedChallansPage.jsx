import React, { useState, useEffect } from "react";
import RightSidebar from "./RightSidebar";
import QuickActions from "./QuickActions";
import SelectShowMore from "./SelectShowMore";
import CustomModal from "./CustomModal";
import { FiDownloadCloud, FiPrinter } from "react-icons/fi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import scLogo from "../assets/sc-logo.png";
import { resolvePerHostEnv, getWhitelabelHosts } from "../utils/whitelabel";

const WHITELABEL_HOSTS = getWhitelabelHosts();
const CURRENT_HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const DEFAULT_HOST = 'app.smartchallan.com';
const IS_DEFAULT_DOMAIN = CURRENT_HOSTNAME === DEFAULT_HOST;
const IS_WHITELABEL = WHITELABEL_HOSTS.includes(CURRENT_HOSTNAME) && !IS_DEFAULT_DOMAIN;
const BRAND_LOGO = (IS_WHITELABEL && resolvePerHostEnv(CURRENT_HOSTNAME, 'LOGO_URL')) || import.meta.env.VITE_CUSTOM_LOGO_URL || scLogo;
import "./LatestTable.css";
import "./RightSidebar.css";
import "../RegisterVehicle.css";
// Reuse ChallanTableV2 pattern from MyChallans.jsx

function formatDate(dateStr) {
  if (!dateStr) return '-';
  let d = null;
  if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) d = new Date(dateStr.replace(/-/g, ' '));
  else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) { const [day, month, year] = dateStr.split('-'); d = new Date(`${year}-${month}-${day}`); }
  else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) d = new Date(dateStr);
  else d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
}

function ChallanTableV2({ title, data, onView, visibleCount, onShowMore, onReset, searchTerm, setSearchTerm, onClickDownload, onClickPrint }) {
  const effectiveVisible = typeof visibleCount === 'number' && visibleCount > 0
    ? visibleCount
    : data.length;

  const [maxFineFilter, setMaxFineFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  const parseFine = (val) => {
    if (val === null || val === undefined || val === '') return NaN;
    const num = parseFloat(String(val).replace(/[,₹\s]/g, ''));
    return Number.isNaN(num) ? NaN : num;
  };

  const filteredData = Array.isArray(data)
    ? data.filter((c) => {
        const term = (searchTerm || '').toLowerCase();
        if (term) {
          const v = String(c.vehicle_number || '').toLowerCase();
          const n = String(c.challan_no || '').toLowerCase();
          if (!v.includes(term) && !n.includes(term)) return false;
        }

        if (maxFineFilter !== null) {
          const fine = parseFine(c.fine_imposed);
          if (!Number.isNaN(fine) && fine > maxFineFilter) return false;
        }

        return true;
      })
    : [];

  const sortedData = React.useMemo(() => {
    if (!Array.isArray(filteredData)) return [];
    if (!sortConfig.key) return filteredData;

    const parseChallanDate = (s) => {
      if (!s) return 0;
      const str = String(s);
      const normalized = str.replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3');
      const t = Date.parse(normalized);
      return Number.isNaN(t) ? 0 : t;
    };

    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const at = parseChallanDate(a.challan_date_time);
        const bt = parseChallanDate(b.challan_date_time);
        return sortConfig.direction === 'asc' ? at - bt : bt - at;
      }
      if (sortConfig.key === 'paid') {
        const pa = parseFine(a.received_amount);
        const pb = parseFine(b.received_amount);
        const av = Number.isNaN(pa) ? 0 : pa;
        const bv = Number.isNaN(pb) ? 0 : pb;
        return sortConfig.direction === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const limitedData = sortedData.slice(0, effectiveVisible);

  const totalPaid = Array.isArray(filteredData)
    ? filteredData.reduce((sum, c) => {
        const val = c.received_amount;
        if (val === null || val === undefined || val === "") return sum;
        const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
        return Number.isNaN(num) ? sum : sum + num;
      }, 0)
    : 0;
  return (
    <div className="dashboard-latest" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px 0 rgba(30,136,229,0.07)', border: '1.5px solid #e3eaf1', padding: '0 0 18px 0', marginBottom: 0, minHeight: 340, transition: 'box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{ margin: 0, fontSize: 19, color: '#1565c0', letterSpacing: '0.01em', fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.2, fontWeight: 700 }}>{title}</h2>
        </div>
        {filteredData.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
            <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, boxShadow: '0 1px 4px #21cbf322' }}>
              Showing {Math.min(filteredData.length, effectiveVisible)} of {filteredData.length} records
            </div>
            <div style={{ color: '#1b5e20', fontSize: 14, background: '#e8f5e9', border: '1.5px solid #a5d6a7', borderRadius: 6, padding: '4px 12px', fontWeight: 700, boxShadow: '0 1px 4px #a5d6a722' }}>
              Total Challan Paid:
              <span style={{ marginLeft: 4 }}>
                {"₹"}
                {totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px 8px 24px', borderTop: '1px solid #e3eaf1', borderBottom: '1px solid #e3eaf1', background: '#f7f9fc' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="number-plate-container" style={{ minWidth: 220, maxWidth: 330 }}>
            <div className="number-plate-wrapper">
              <div className="number-plate-badge">IND</div>
              <div className="tricolor-strip">
                <div className="saffron"></div>
                <div className="white"></div>
                <div className="green"></div>
              </div>
              <input
                type="text"
                className="number-plate-input"
                placeholder="Vechicle No. / Challan no."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
              />
            </div>
            <div className="security-features">
              <div className="hologram"></div>
              <div className="chakra">⚙</div>
            </div>
          </div>

          {Array.isArray(data) && data.length > 0 && (() => {
            const fines = data
              .map((c) => parseFine(c.fine_imposed))
              .filter((v) => !Number.isNaN(v));
            if (fines.length === 0) return null;
            const maxFine = Math.max(...fines);
            const minFine = Math.min(...fines);
            const effectiveMax = maxFineFilter === null ? maxFine : maxFineFilter;
            return (
              <div className="fine-filter-card">
                <span className="fine-filter-label">Fine up to</span>
                <input
                  type="range"
                  min={minFine}
                  max={maxFine}
                  step={1}
                  value={effectiveMax}
                  onChange={(e) => setMaxFineFilter(Number(e.target.value))}
                  className="fine-filter-range"
                />
                <span className="fine-filter-value">₹{Math.round(effectiveMax)}</span>
                {maxFineFilter !== null && (
                  <button
                    type="button"
                    onClick={() => setMaxFineFilter(null)}
                    className="fine-filter-reset-btn"
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            title="Download"
            onClick={() => { if (typeof onClickDownload === 'function') onClickDownload(filteredData); }}
            style={{ background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: 999, cursor: 'pointer', color: '#0d47a1', fontSize: 18, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiDownloadCloud />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Download</span>
          </button>
          <button
            title="Print Table"
            onClick={() => { if (typeof onClickPrint === 'function') onClickPrint(filteredData); }}
            style={{ background: '#f3e5f5', border: '1px solid #e1bee7', borderRadius: 999, cursor: 'pointer', color: '#4a148c', fontSize: 18, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiPrinter />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Print</span>
          </button>
        </div>
      </div>
      <div className="table-container" id="disposed-challans-table-print-area">
        <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle No.</th>
              <th>Challan No</th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() =>
                  setSortConfig((prev) => {
                    if (prev.key === 'date') {
                      return {
                        key: 'date',
                        direction: prev.direction === 'asc' ? 'desc' : 'asc',
                      };
                    }
                    return { key: 'date', direction: 'asc' };
                  })
                }
              >
                Date/Time
                <span style={{ fontSize: 13, marginLeft: 2 }}>
                  {sortConfig.key === 'date'
                    ? sortConfig.direction === 'asc'
                      ? '▲'
                      : '▼'
                    : '▲▼'}
                </span>
              </th>
              <th>Location</th>
              <th>Fine Imposed</th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() =>
                  setSortConfig((prev) => {
                    if (prev.key === 'paid') {
                      return {
                        key: 'paid',
                        direction: prev.direction === 'asc' ? 'desc' : 'asc',
                      };
                    }
                    return { key: 'paid', direction: 'asc' };
                  })
                }
              >
                Fine Paid
                <span style={{ fontSize: 13, marginLeft: 2 }}>
                  {sortConfig.key === 'paid'
                    ? sortConfig.direction === 'asc'
                      ? '▲'
                      : '▼'
                    : '▲▼'}
                </span>
              </th>
              <th>Status</th>
              <th>Offence Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={10}>No challans found.</td></tr>
            ) : (
              limitedData.map((c, idx) => (
                <tr key={c.challan_no || idx}>
                  <td>{idx + 1}</td>
                  <td>{c.vehicle_number || '-'}</td>
                  <td>{c.challan_no || '-'}</td>
                  <td>{c.challan_date_time || '-'}</td>
                  <td>
                    {(() => {
                      const loc = c.challan_place || c.location || c.challan_location || c.address || c.owner_address;
                      if (loc && typeof loc === 'string' && loc.trim()) {
                        return (
                          <span
                            title={loc}
                            style={{ cursor: 'default', color: '#4285F4', fontSize: 20, verticalAlign: 'middle' }}
                          >
                            <i className="ri-map-pin-2-fill" />
                          </span>
                        );
                      }
                      return 'Not Available';
                    })()}
                  </td>
                  <td>{c.fine_imposed ?? '-'}</td>
                  <td>{c.received_amount ?? '-'}</td>
                  <td>
                    <span className={`modern-table-status ${c.challan_status === 'Pending' ? 'pending' : c.challan_status === 'Disposed' ? 'paid' : ''}`}>{c.challan_status}</span>
                  </td>
                  <td>
                    <ul className="modern-table-offence-list">
                      {Array.isArray(c.offence_details) && c.offence_details.map((o, i) => (
                        <li key={i} className="cell-ellipsis" title={o.name}>{o.name}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <button
                      className="action-btn flat-btn"
                      onClick={() => onView(c)}>
                      <i className="ri-eye-line" style={{fontSize:20}}></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredData.length > 30 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 24 }}>
          <span style={{ color: '#1976d2', fontSize: 15 }}>
            Show more records:
          </span>
          <SelectShowMore
            onShowMoreRecords={onShowMore}
            onResetRecords={onReset}
            maxCount={filteredData.length}
          />
        </div>
      )}
    </div>
  );
}

// Build printable HTML for disposed challans table (without Action column)
const buildPrintableDisposedTableHtml = () => {
  const printArea = document.getElementById("disposed-challans-table-print-area");
  if (!printArea) return null;
  const table = printArea.querySelector("table");
  if (!table) return null;

  const printTable = table.cloneNode(true);

  try {
    const theadRows = printTable.querySelectorAll("thead tr");
    theadRows.forEach((tr) => {
      const cells = tr.querySelectorAll("th");
      if (cells.length >= 1) {
        tr.removeChild(cells[cells.length - 1]);
      }
    });

    const bodyRows = printTable.querySelectorAll("tbody tr");
    bodyRows.forEach((tr) => {
      const cells = tr.querySelectorAll("td");
      if (cells.length >= 1) {
        tr.removeChild(cells[cells.length - 1]);
      }
    });

    // Ensure offence details are fully visible in print/PDF (no ellipsis)
    const offenceCells = printTable.querySelectorAll('.cell-ellipsis');
    offenceCells.forEach((el) => {
      el.classList.remove('cell-ellipsis');
      el.style.whiteSpace = 'normal';
      el.style.overflow = 'visible';
      el.style.textOverflow = 'clip';
      el.style.maxWidth = 'none';
    });
  } catch (e) {
    // ignore
  }

  return printTable.outerHTML;
};

const handleDisposedPrint = () => {
  const tableHtml = buildPrintableDisposedTableHtml();
  if (!tableHtml) return;

  const win = window.open("", "", "height=700,width=1200");
  if (!win) return;
  win.document.write("<html><head><title>Disposed Challans</title>");
  win.document.write('<link rel="stylesheet" href="/src/LatestTable.css" />');
  win.document.write(
    "<style>body { margin: 16px; font-family: Segoe UI, Arial, sans-serif; } .sc-branding { display:flex; align-items:center; gap:12px; margin-bottom:16px; } .sc-branding-logo { height:24px !important; max-width:120px !important; object-fit:contain !important; } .sc-branding-text { display:flex; flex-direction:column; } .sc-branding-title { font-size:18px; font-weight:700; color:#1565c0; margin:0; } .sc-branding-sub { font-size:11px; color:#555; margin:4px 0 0; } body .latest-table th, body .latest-table td { padding: 6px 8px !important; font-size: 80% !important; } table { width:100%; border-collapse:collapse; }</style>"
  );
  win.document.write("</head><body>");
  win.document.write('<div class="sc-branding">');
  win.document.write(
    `<img class="sc-branding-logo" src="${BRAND_LOGO}" alt="Smart Challan Logo" />`
  );
  win.document.write('<div class="sc-branding-text">');
  win.document.write('<p class="sc-branding-sub">Disposed Challans Summary</p>');
  win.document.write("</div>");
  win.document.write("</div>");
  win.document.write(tableHtml);
  win.document.write("</body></html>");
  win.document.close();
  win.print();
};

const handleDisposedDownloadPdf = () => {
  const tableHtml = buildPrintableDisposedTableHtml();
  if (!tableHtml) return;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = `
    <div class="sc-branding">
      <img class="sc-branding-logo" style="height:36px; max-width:180px; object-fit:contain;" src="${BRAND_LOGO}" alt="Smart Challan Logo" />
      <div class="sc-branding-text">
        <p class="sc-branding-sub">Disposed Challans Summary</p>
      </div>
    </div>
    ${tableHtml}
  `;
  document.body.appendChild(container);

  setTimeout(() => {
    html2canvas(container, {
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => {
        return (
          element instanceof SVGElement ||
          element.tagName?.toLowerCase() === "svg"
        );
      },
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF("l", "pt", "a4");

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

        pdf.addImage(imgData, "JPEG", marginX, position, imgWidth, imgHeight);
        heightLeft -= availableHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          position = marginY - (imgHeight - heightLeft);
          pdf.addImage(imgData, "JPEG", marginX, position, imgWidth, imgHeight);
          heightLeft -= availableHeight;
        }

        pdf.save("DisposedChallans.pdf");
      })
      .finally(() => {
        document.body.removeChild(container);
      });
  }, 400);
};

const handleDisposedDownloadExcel = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const exportData = rows.map((c) => ({
    "Vehicle Number": c.vehicle_number,
    "Challan No": c.challan_no,
    "Challan Date/Time": c.challan_date_time,
    Location:
      c.challan_place ||
      c.location ||
      c.challan_location ||
      c.address ||
      c.owner_address,
    "Fine Imposed": c.fine_imposed,
    "Fine Paid": c.received_amount,
    Status: c.challan_status,
    "Offence Details": Array.isArray(c.offence_details)
      ? c.offence_details.map((o) => o && o.name ? o.name : '').filter(Boolean).join('; ')
      : '',
  }));
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DisposedChallans");
  XLSX.writeFile(wb, "DisposedChallans.xlsx");
};

export default function DisposedChallansPage() {
  const [challanData, setChallanData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const DEFAULT_LIMIT = 30;
  const [visibleCount, setVisibleCount] = useState(DEFAULT_LIMIT);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("excel");
  const [downloadRows, setDownloadRows] = useState([]);
  useEffect(() => {
    async function fetchChallans() {
      try {
        const API_ROOT = import.meta.env.VITE_API_BASE_URL;
        if (!API_ROOT) return setChallanData([]);
        let clientId = null;
        try {
          const stored = JSON.parse(localStorage.getItem('sc_user')) || {};
          if (stored && stored.user) {
            clientId = stored.user.id || stored.user._id || stored.user.client_id || null;
          }
        } catch (e) { clientId = null; }
        if (!clientId) return setChallanData([]);
        const url = `${API_ROOT}/getvehicleechallandata?clientId=${clientId}`;
        const res = await fetch(url);
        const data = await res.json();
        const allDisposed = [];
        if (Array.isArray(data)) {
          data.forEach(vehicle => {
            if (Array.isArray(vehicle.disposed_data)) {
              vehicle.disposed_data.forEach(c => {
                allDisposed.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
          });
        }
        allDisposed.sort((a, b) => {
          const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
          const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
          const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
          return (bTime || 0) - (aTime || 0);
        });
        setChallanData(allDisposed);
      } catch (err) {
        setChallanData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChallans();
  }, []);
  return (
    <div className="my-challans-content">
      {/* <h2 className="page-title">Disposed Challans</h2> */}
      <p className="page-subtitle">View and manage your Disposed challans</p>
      {!sidebarOpen && (
        <div className="main-quick-actions-wrapper">
          <QuickActions
            title="Quick Actions"
            sticky={true}
            onAddVehicle={() => {}}
            onBulkUpload={() => {}}
            onPay={() => {}}
            onReports={() => {}}
            onContact={() => {}}
          />
        </div>
      )}
      <div style={{marginTop: '18px'}}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 999,
                background: '#e3f2fd',
                border: '1px solid #bbdefb',
                color: '#1565c0',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid #90caf9',
                  borderTopColor: '#1565c0',
                  animation: 'sc-spin 0.8s linear infinite',
                }}
              />
              <span>Loading disposed challans - please wait...</span>
            </div>
          </div>
        ) : (
          <ChallanTableV2
            title="Disposed Challans"
            data={challanData}
            onView={c => {
              setSelectedChallan(c);
              setSidebarOpen(true);
            }}
            visibleCount={visibleCount}
            onShowMore={val => {
              if (val === 'all') setVisibleCount(challanData.length);
              else setVisibleCount(Number(val));
            }}
            onReset={() => setVisibleCount(DEFAULT_LIMIT)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClickDownload={(rows) => {
              setDownloadRows(Array.isArray(rows) ? rows : []);
              setDownloadFormat('excel');
              setShowDownloadModal(true);
            }}
            onClickPrint={(rows) => { if (typeof handleDisposedPrint === 'function') handleDisposedPrint(rows); }}
          />
        )}
      </div>
      {sidebarOpen && selectedChallan && (
        <RightSidebar
          open={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setTimeout(() => setSelectedChallan(null), 300);
          }}
          title={selectedChallan ? `Challan Details: ${selectedChallan.challan_no}` : "Challan Details"}
        >
          <table className="latest-table" style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr><td><b>Status</b></td><td>{selectedChallan.challan_status}</td></tr>
              <tr><td><b>Vehicle Number</b></td><td>{selectedChallan.vehicle_number}</td></tr>
              <tr><td><b>Challan No</b></td><td>{selectedChallan.challan_no}</td></tr>
              <tr><td><b>Date/Time</b></td><td>{selectedChallan.challan_date_time}</td></tr>
              <tr><td><b>Location</b></td><td>{selectedChallan.challan_place || selectedChallan.location || selectedChallan.challan_location}</td></tr>
              <tr><td><b>Owner Name</b></td><td>{selectedChallan.owner_name}</td></tr>
              <tr><td><b>Driver Name</b></td><td>{selectedChallan.driver_name}</td></tr>
              <tr><td><b>Name of Violator</b></td><td>{selectedChallan.name_of_violator}</td></tr>
              <tr><td><b>Department</b></td><td>{selectedChallan.department}</td></tr>
              <tr><td><b>State Code</b></td><td>{selectedChallan.state_code}</td></tr>
              <tr><td><b>RTO District Name</b></td><td>{selectedChallan.rto_distric_name}</td></tr>
              <tr><td><b>Remark</b></td><td>{selectedChallan.remark}</td></tr>
              <tr><td><b>Document Impounded</b></td><td>{selectedChallan.document_impounded}</td></tr>
              <tr><td><b>Sent to Court On</b></td><td>{selectedChallan.sent_to_court_on}</td></tr>
              <tr><td><b>Sent to Reg Court</b></td><td>{selectedChallan.sent_to_reg_court}</td></tr>
              <tr><td><b>Sent to Virtual Court</b></td><td>{selectedChallan.sent_to_virtual_court}</td></tr>
              <tr><td><b>Court Name</b></td><td>{selectedChallan.court_name}</td></tr>
              <tr><td><b>Court Address</b></td><td>{selectedChallan.court_address}</td></tr>
              <tr><td><b>Date of Proceeding</b></td><td>{selectedChallan.date_of_proceeding}</td></tr>
              <tr><td><b>DL No</b></td><td>{selectedChallan.dl_no}</td></tr>
              <tr><td><b>Receipt No</b></td><td>{selectedChallan.receipt_no}</td></tr>
              <tr><td><b>Received Amount</b></td><td>{selectedChallan.received_amount}</td></tr>
              <tr><td><b>Fine Imposed</b></td><td>{selectedChallan.fine_imposed}</td></tr>
              <tr><td><b>Amount of Fine Imposed</b></td><td>{selectedChallan.amount_of_fine_imposed}</td></tr>
              <tr><td><b>Act</b></td><td>{Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.length > 0 ? selectedChallan.offence_details[0].act : ''}</td></tr>
              <tr><td><b>Offence Details</b></td><td><ul style={{margin:0,paddingLeft:18}}>{Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.map((o, j) => (<li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>))}</ul></td></tr>
            </tbody>
          </table>
        </RightSidebar>
      )}
      <CustomModal
        open={showDownloadModal}
        title="Download Disposed Challans"
        description="Choose the format in which you want to download the challans."
        confirmText={downloadFormat === 'excel' ? 'Download Excel' : 'Download PDF'}
        cancelText="Cancel"
        onConfirm={() => {
          const rows = Array.isArray(downloadRows) ? downloadRows : (Array.isArray(challanData) ? challanData : []);
          if (downloadFormat === 'excel') {
            handleDisposedDownloadExcel(rows);
          } else {
            handleDisposedDownloadPdf();
          }
          setShowDownloadModal(false);
        }}
        onCancel={() => setShowDownloadModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="download-format-disposed"
              value="excel"
              checked={downloadFormat === 'excel'}
              onChange={() => setDownloadFormat('excel')}
            />
            <span>Excel (.xlsx)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="download-format-disposed"
              value="pdf"
              checked={downloadFormat === 'pdf'}
              onChange={() => setDownloadFormat('pdf')}
            />
            <span>PDF</span>
          </label>
        </div>
      </CustomModal>
    </div>
  );
}
