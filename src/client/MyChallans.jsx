// Table utility for date formatting
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

// Helper to get a comparable timestamp for challan date/time
function getChallanTimestamp(raw) {
  if (!raw) return 0;
  let val = String(raw).trim();
  if (!val) return 0;

  // Take only date portion if there is time
  const base = val.split(/[ T]/)[0];
  let d = null;

  if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(base)) {
    d = new Date(base.replace(/-/g, ' '));
  } else if (/\d{2}-\d{2}-\d{4}/.test(base)) {
    const [day, month, year] = base.split('-');
    d = new Date(`${year}-${month}-${day}`);
  } else if (/\d{4}-\d{2}-\d{2}/.test(base)) {
    d = new Date(base);
  } else {
    d = new Date(val);
  }

  const ts = d.getTime();
  return isNaN(ts) ? 0 : ts;
}

export function ChallanTableV2({
  title,
  data,
  onView,
  onClickDownload,
  onClickPrint,
  settlementMode = false,
  cart = [],
  addToCart,
  removeFromCart,
  initialFilter = null,
}) {
  const DEFAULT_LIMIT = 30;
  const [visibleCount, setVisibleCount] = React.useState(DEFAULT_LIMIT);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [maxFineFilter, setMaxFineFilter] = React.useState(null);
  const [challanTypeFilter, setChallanTypeFilter] = React.useState({ regCourt: false, virtualCourt: false });
  // Status filter: Pending / Disposed checkboxes (both unchecked = show all)
  const [statusFilter, setStatusFilter] = React.useState({ pending: false, disposed: false });
  const [showChallanTypeDropdown, setShowChallanTypeDropdown] = React.useState(false);
  const challanTypeDropdownRef = React.useRef(null);
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: "desc" });
  const [mapModal, setMapModal] = React.useState({ open: false, location: null });

  // Auto-check Pending/Disposed checkbox if initialFilter prop provided or sc_challan_filter is set
  React.useEffect(() => {
    if (initialFilter === 'pending') {
      setStatusFilter({ pending: true, disposed: false });
      return;
    }
    if (initialFilter === 'disposed') {
      setStatusFilter({ pending: false, disposed: true });
      return;
    }
    if (typeof window === 'undefined') return;
    const filter = localStorage.getItem('sc_challan_filter');
    if (filter === 'pending') {
      setStatusFilter({ pending: true, disposed: false });
      localStorage.removeItem('sc_challan_filter');
    } else if (filter === 'disposed') {
      setStatusFilter({ pending: false, disposed: true });
      localStorage.removeItem('sc_challan_filter');
    }
  }, [initialFilter]);

  const filteredData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];

    const term = (searchTerm || "").toLowerCase();
    const hasSearch = term.length > 0;

    const parseFine = (val) => {
      if (val === null || val === undefined || val === "") return NaN;
      const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
      return Number.isNaN(num) ? NaN : num;
    };

    const normalizeCourtFlag = (val) => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim().toLowerCase();
      if (!s || s === "-" || s === "na" || s === "n/a") return null;
      if (s === "no") return false;
      return true;

      const totalFine = React.useMemo(() => {
        if (!Array.isArray(filteredData)) return 0;
        return filteredData.reduce((sum, c) => {
          const val = c.fine_imposed;
          if (val === null || val === undefined || val === "") return sum;
          const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
          return Number.isNaN(num) ? sum : sum + num;
        }, 0);
      }, [filteredData]);

      const totalPaid = React.useMemo(() => {
        if (!Array.isArray(filteredData)) return 0;
        return filteredData.reduce((sum, c) => {
          const val = c.received_amount;
          if (val === null || val === undefined || val === "") return sum;
          const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
          return Number.isNaN(num) ? sum : sum + num;
        }, 0);
      }, [filteredData]);
    };

    const { regCourt, virtualCourt } = challanTypeFilter;
    const { pending, disposed } = statusFilter;

    let result = data.filter((c) => {
      // Filter by challan_status based on Pending / Disposed checkboxes.
      // When both are unchecked, do not filter by status (show all).
      const status = String(c.challan_status || "").toLowerCase();
      if (pending || disposed) {
        const isPending = status === "pending";
        const isDisposed = status === "disposed";
        const matchesSelected = (pending && isPending) || (disposed && isDisposed);
        if (!matchesSelected) return false;
      }

      if (hasSearch) {
        const v = String(c.vehicle_number || "").toLowerCase();
        const n = String(c.challan_no || "").toLowerCase();
        if (!v.includes(term) && !n.includes(term)) return false;
      }

      if (maxFineFilter !== null) {
        const fine = parseFine(c.fine_imposed);
        if (!Number.isNaN(fine) && fine > maxFineFilter) return false;
      }

      if (regCourt || virtualCourt) {
        const regRaw = c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court;
        const virtRaw = c.sent_to_virtual_court ?? c.sent_to_virtual;

        const regFlag = normalizeCourtFlag(regRaw);
        const virtFlag = normalizeCourtFlag(virtRaw);

        let pass = true;
        if (regCourt && !virtualCourt) {
          pass = regFlag === true;
        } else if (!regCourt && virtualCourt) {
          pass = virtFlag === true;
        } else if (regCourt && virtualCourt) {
          // Show only records where BOTH are yes
          pass = regFlag === true && virtFlag === true;
        }

        if (!pass) return false;
      }

      return true;
    });

    if (sortConfig.key) {
      const sorted = [...result];
      sorted.sort((a, b) => {
        if (sortConfig.key === "date") {
          const at = getChallanTimestamp(a.challan_date_time);
          const bt = getChallanTimestamp(b.challan_date_time);
          return sortConfig.direction === "asc" ? at - bt : bt - at;
        }
        if (sortConfig.key === "fine") {
          const fa = parseFine(a.fine_imposed);
          const fb = parseFine(b.fine_imposed);
          const av = Number.isNaN(fa) ? 0 : fa;
          const bv = Number.isNaN(fb) ? 0 : fb;
          return sortConfig.direction === "asc" ? av - bv : bv - av;
        }
        return 0;
      });
      return sorted;
    }

    return result;
  }, [data, searchTerm, maxFineFilter, challanTypeFilter, sortConfig, statusFilter]);

  const limitedData = React.useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount]
  );

  const totalFine = React.useMemo(() => {
    if (!Array.isArray(filteredData)) return 0;
    return filteredData.reduce((sum, c) => {
      const val = c.fine_imposed;
      if (val === null || val === undefined || val === "") return sum;
      const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
      return Number.isNaN(num) ? sum : sum + num;
    }, 0);
  }, [filteredData]);

  const totalPaid = React.useMemo(() => {
    if (!Array.isArray(filteredData)) return 0;
    return filteredData.reduce((sum, c) => {
      const val = c.received_amount;
      if (val === null || val === undefined || val === "") return sum;
      const num = parseFloat(String(val).replace(/[,₹\s]/g, ""));
      return Number.isNaN(num) ? sum : sum + num;
    }, 0);
  }, [filteredData]);

  React.useEffect(() => {
    setVisibleCount(DEFAULT_LIMIT);
  }, [searchTerm]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        challanTypeDropdownRef.current &&
        !challanTypeDropdownRef.current.contains(event.target)
      ) {
        setShowChallanTypeDropdown(false);
      }
    };
    if (showChallanTypeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showChallanTypeDropdown]);

  return (
    <div
      className="dashboard-latest"
      style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px 0 rgba(30,136,229,0.07)",
        border: "1.5px solid #e3eaf1",
        padding: "0 0 18px 0",
        marginBottom: 0,
        minHeight: 340,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Table header with title, matching other dashboard tables */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
    // together in the Vehicle Challans table with status filters.
          padding: "0 24px 0 0",
          minHeight: 54,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 4,
              height: 32,
              background:
                "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
              borderRadius: 3,
              marginRight: 14,
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 19,
              color: "#b26a00",
              letterSpacing: "0.01em",
              fontFamily: "Segoe UI, Arial, sans-serif",
              lineHeight: 1.2,
              fontWeight: 700,
            }}
          >
            {title}
          </h2>
        </div>
        {filteredData.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                padding: '6px 10px',
                borderRadius: 8,
                color: (statusFilter.disposed && !statusFilter.pending) ? '#1b5e20' : '#b71c1c',
                background: (statusFilter.disposed && !statusFilter.pending) ? '#e8f5e9' : '#ffebee',
                border: (statusFilter.disposed && !statusFilter.pending) ? '1.5px solid #a5d6a7' : '1.5px solid #ef9a9a'
              }}>
                {(statusFilter.disposed && !statusFilter.pending) ? 'Total Fine Paid:' : 'Total Challan Value:'}
                <span style={{ marginLeft: 6 }}>
                  {'₹'}{((statusFilter.disposed && !statusFilter.pending) ? totalPaid : totalFine).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div
              style={{
                color: "#1565c0",
                fontSize: 14,
                background: "#f5f8fa",
                border: "1.5px solid #2196f3",
                borderRadius: 6,
                padding: "4px 12px",
                fontWeight: 700,
                boxShadow: "0 1px 4px #21cbf322",
              }}
            >
              Showing {Math.min(filteredData.length, limitedData.length)} of {filteredData.length} records
            </div>
            {title && (title.toLowerCase().includes("pending") || title.toLowerCase().includes("disposed") || title.toLowerCase().includes("challan settlement")) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontWeight: 700,
                    boxShadow: "0 1px 4px #00000022",
                    color: title.toLowerCase().includes("disposed") ? "#1b5e20" : "#b71c1c",
                    background: title.toLowerCase().includes("disposed") ? "#e8f5e9" : "#ffebee",
                    border: title.toLowerCase().includes("disposed") ? "1.5px solid #a5d6a7" : "1.5px solid #ef9a9a",
                  }}
                >
                  {title.toLowerCase().includes("disposed")
                    ? "Total Fine Paid: "
                    : "Total Challan Value: "}
                  <span style={{ marginLeft: 4 }}>
                    {"₹"}
                    {(title.toLowerCase().includes("disposed") ? totalPaid : totalFine).toLocaleString("en-IN")}
                  </span>
                </div>
                {settlementMode && Array.isArray(cart) && (
                  <button
                    type="button"
                    className="action-btn flat-btn"
                    disabled={cart.length === 0}
                    title={cart.length === 0 ? "No challans in cart" : "View challan cart"}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const ev = new CustomEvent("challan-cart-toggle");
                        window.dispatchEvent(ev);
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      fontSize: 13,
                      opacity: cart.length === 0 ? 0.55 : 1,
                    }}
                  >
                    <i className="ri-shopping-cart-2-line" style={{ fontSize: 18 }} />
                    {cart.length > 0 && (
                      <span
                        style={{
                          minWidth: 18,
                          height: 18,
                          borderRadius: 999,
                          background: "#e53935",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "0 4px",
                        }}
                      >
                        {cart.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px 8px 24px",
          borderTop: "1px solid #e3eaf1",
          borderBottom: "1px solid #e3eaf1",
          background: "#f7f9fc",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            className="number-plate-container"
            style={{ minWidth: 220, maxWidth: 330 }}
          >
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
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                  )
                }
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
              .map((c) => {
                const v = c.fine_imposed;
                if (v === null || v === undefined || v === "") return NaN;
                const num = parseFloat(String(v).replace(/[,₹\s]/g, ""));
                return Number.isNaN(num) ? NaN : num;
              })
              .filter((v) => !Number.isNaN(v));
            if (fines.length === 0) return null;
            const maxFine = Math.max(...fines);
            const minFine = Math.min(...fines);
            const effectiveMax =
              maxFineFilter === null ? maxFine : maxFineFilter;
            return (
              <div className="fine-filter-card">
                <span className="fine-filter-label">Fine up to</span>
                <input
                  type="range"
                  min={minFine}
                  max={maxFine}
                  step={1}
                  value={effectiveMax}
                  onChange={(e) =>
                    setMaxFineFilter(Number(e.target.value))
                  }
                  className="fine-filter-range"
                />
                <span className="fine-filter-value">
                  ₹{Math.round(effectiveMax)}
                </span>
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

          <div
            style={{ position: "relative" }}
            ref={challanTypeDropdownRef}
            onMouseLeave={() => setShowChallanTypeDropdown(false)}
          >
            <button
              type="button"
              className="filter-select"
              style={{
                minWidth: 180,
                textAlign: "left",
                padding: "16px 15px",
                border: "1px solid #bcd",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
              }}
              onClick={() => setShowChallanTypeDropdown((v) => !v)}
            >
              {(!challanTypeFilter.regCourt &&
              !challanTypeFilter.virtualCourt)
                ? "Select challan type"
                : [
                    challanTypeFilter.regCourt
                      ? "Registered court"
                      : null,
                    challanTypeFilter.virtualCourt
                      ? "Virtual court"
                      : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
              {(challanTypeFilter.regCourt ||
                challanTypeFilter.virtualCourt) && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "#fff3e0",
                    color: "#ef6c00",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {Number(!!challanTypeFilter.regCourt) +
                    Number(!!challanTypeFilter.virtualCourt)}
                </span>
              )}
              <span
                style={{
                  float: "right",
                  fontWeight: 700,
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                ▼
              </span>
            </button>
            {showChallanTypeDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: 38,
                  left: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: "1.5px solid #bcd",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px #0001",
                  minWidth: 190,
                  padding: 8,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={challanTypeFilter.regCourt}
                    onChange={(e) =>
                      setChallanTypeFilter((prev) => ({
                        ...prev,
                        regCourt: e.target.checked,
                      }))
                    }
                  />
                  Registered court
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={challanTypeFilter.virtualCourt}
                    onChange={(e) =>
                      setChallanTypeFilter((prev) => ({
                        ...prev,
                        virtualCourt: e.target.checked,
                      }))
                    }
                  />
                  Virtual court
                </label>
                {(challanTypeFilter.regCourt ||
                  challanTypeFilter.virtualCourt) && (
                  <div
                    style={{
                      textAlign: "right",
                      marginTop: 6,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        fontSize: 13,
                        padding: "2px 10px",
                        borderRadius: 5,
                        border: "1px solid #bcd",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setChallanTypeFilter({
                          regCourt: false,
                          virtualCourt: false,
                        })
                      }
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      style={{
                        fontSize: 13,
                        padding: "2px 10px",
                        borderRadius: 5,
                        border: "1px solid #bcd",
                        background: "#f5f8fa",
                        cursor: "pointer",
                      }}
                      onClick={() => setShowChallanTypeDropdown(false)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status filter: Pending / Disposed toggles */}
          <div className="challan-status-filter-wrapper">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={statusFilter.pending}
                onChange={() =>
                  setStatusFilter((prev) => ({ ...prev, pending: !prev.pending }))
                }
              />
              <span>Pending</span>
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={statusFilter.disposed}
                onChange={() =>
                  setStatusFilter((prev) => ({ ...prev, disposed: !prev.disposed }))
                }
              />
              <span>Disposed</span>
            </label>
          </div>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <button
            title="Download"
            onClick={() => { if (typeof onClickDownload === 'function') onClickDownload(filteredData); }}
            style={{
              background: "#e3f2fd",
              border: "1px solid #bbdefb",
              borderRadius: 999,
              cursor: "pointer",
              color: "#0d47a1",
              fontSize: 18,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiDownloadCloud />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Download</span>
          </button>
          <button
            title="Print Table"
            onClick={() => { if (typeof onClickPrint === 'function') onClickPrint(filteredData); }}
            style={{
              background: "#f3e5f5",
              border: "1px solid #e1bee7",
              borderRadius: 999,
              cursor: "pointer",
              color: "#4a148c",
              fontSize: 18,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiPrinter />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Print</span>
          </button>
        </div>
      </div>

      <div className="table-container" id="my-challans-table-print-area">
        <table
          className="latest-table"
          style={{ width: "100%", marginTop: 8 }}
        >
          <thead>
            <tr>
              {settlementMode && <th></th>}
              <th>#</th>
              <th>Vehicle No.</th>
              <th>Challan No</th>
              <th
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => handleSort("date")}
              >
                Date/Time
                <span style={{ fontSize: 13, marginLeft: 2 }}>
                  {sortConfig.key === "date"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "▲▼"}
                </span>
              </th>
              <th>Location</th>
              <th>RTO District</th>
              <th>Challan Type</th>
              <th
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => handleSort("fine")}
              >
                Fine Imposed
                <span style={{ fontSize: 13, marginLeft: 2 }}>
                  {sortConfig.key === "fine"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : "▲▼"}
                </span>
              </th>
              {title.toLowerCase().includes("disposed") && <th>Fine Paid</th>}
              <th>Status</th>
              <th>Offence Details</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    (title.toLowerCase().includes("pending") ? 11 : 10) +
                    (settlementMode ? 1 : 0)
                  }
                >
                  No challans found.
                </td>
              </tr>
            ) : (
              limitedData.map((c, idx) => (
                <tr key={c.challan_no || idx}>
                  {settlementMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(cart) &&
                          cart.some((s) => s.challan_no === c.challan_no)
                        }
                        onChange={() => {
                          if (!addToCart || !removeFromCart) return;
                          const inCart =
                            Array.isArray(cart) &&
                            cart.some((s) => s.challan_no === c.challan_no);
                          if (inCart) removeFromCart(c);
                          else addToCart(c);
                        }}
                      />
                    </td>
                  )}
                  <td>{idx + 1}</td>
                  <td>{c.vehicle_number || "-"}</td>
                  <td>{c.challan_no || "-"}</td>
                  <td>{c.challan_date_time || '-'}</td>
                  <td>
                    {(() => {
                      const loc =
                        c.challan_place ||
                        c.location ||
                        c.challan_location ||
                        c.address ||
                        c.owner_address;
                      if (
                        loc &&
                        typeof loc === "string" &&
                        loc.trim()
                      ) {
                        return (
                          <span
                            title={loc}
                            onClick={() =>
                              setMapModal({ open: true, location: loc })
                            }
                            style={{
                              cursor: "pointer",
                              color: "#4285F4",
                              fontSize: 20,
                              verticalAlign: "middle",
                            }}
                          >
                            <i className="ri-map-pin-2-fill" />
                          </span>
                        );
                      }
                      return "Not Available";
                    })()}
                  </td>
                  <td>{c.rto_distric_name || c.rto_district_name || '-'}</td>
                  <td>{(() => {
                    const reg = c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court;
                    const virt = c.sent_to_virtual_court ?? c.sent_to_virtual;
                    const isYes = v => {
                      if (typeof v === 'boolean') return v;
                      if (typeof v === 'string') {
                        const s = v.trim().toLowerCase();
                        return s === 'yes' || s === 'y' || s === 'true' || s === '1';
                      }
                      return !!v;
                    };
                    if (isYes(reg)) return 'Registered Court';
                    if (isYes(virt)) return 'Virtual court';
                    return 'Online';
                  })()}</td>
                  <td>{c.fine_imposed ?? "-"}</td>
                  {title.toLowerCase().includes("disposed") && (
                    <td>{c.received_amount ?? "-"}</td>
                  )}
                  <td>
                    <span
                      className={`modern-table-status ${
                        c.challan_status === "Pending"
                          ? "pending"
                          : c.challan_status === "Disposed"
                          ? "paid"
                          : ""
                      }`}
                    >
                      {c.challan_status}
                    </span>
                  </td>
                  <td>
                    <ul className="modern-table-offence-list">
                      {Array.isArray(c.offence_details) &&
                        c.offence_details.map((o, i) => (
                          <li
                            key={i}
                            className="cell-ellipsis"
                            title={o.name}
                          >
                            {o.name}
                          </li>
                        ))}
                    </ul>
                  </td>
                  <td>
                    <button
                      className="action-btn flat-btn"
                      onClick={() => onView(c)}
                    >
                      <i
                        className="ri-eye-line"
                        style={{ fontSize: 20 }}
                      ></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > DEFAULT_LIMIT && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            marginLeft: 24,
          }}
        >
          <span style={{ color: "#1976d2", fontSize: 15 }}>
            Show more records:
          </span>
          <SelectShowMore
            onShowMoreRecords={(val) => {
              if (val === "all") setVisibleCount(filteredData.length);
              else setVisibleCount(Number(val));
            }}
            onResetRecords={() => setVisibleCount(DEFAULT_LIMIT)}
            maxCount={filteredData.length}
          />
        </div>
      )}

      <CustomModal
        open={mapModal.open}
        title="Challan Location Map"
        onConfirm={() => setMapModal({ open: false, location: null })}
        onCancel={() => setMapModal({ open: false, location: null })}
        confirmText="OK"
        cancelText={null}
      >
        {mapModal.location && (
          <div className="map-frame-wrapper">
            <iframe
              title="Google Maps"
              style={{ border: 0, borderRadius: 12, width: '100%' }}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapModal.location
              )}&output=embed`}
              allowFullScreen
            />
          </div>
        )}
      </CustomModal>
    </div>
  );
}
import "./LatestTable.css";

import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import RightSidebar from "./RightSidebar";
import QuickActions from "./QuickActions";
import SelectShowMore from "./SelectShowMore";
import { FiDownloadCloud, FiPrinter } from "react-icons/fi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { fetchImageAsDataUrl } from "../utils/whitelabel";
import scLogo from "../assets/sc-logo.png";
import { resolvePerHostEnv, getWhitelabelHosts } from "../utils/whitelabel";

const WHITELABEL_HOSTS = getWhitelabelHosts();
const CURRENT_HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const DEFAULT_HOST = 'app.smartchallan.com';
const IS_DEFAULT_DOMAIN = CURRENT_HOSTNAME === DEFAULT_HOST;
const IS_WHITELABEL = WHITELABEL_HOSTS.includes(CURRENT_HOSTNAME) && !IS_DEFAULT_DOMAIN;
const BRAND_LOGO = (IS_WHITELABEL && resolvePerHostEnv(CURRENT_HOSTNAME, 'LOGO_URL')) || import.meta.env.VITE_CUSTOM_LOGO_URL || scLogo;
import "./RightSidebar.css";
import "../RegisterVehicle.css";

// Build a printable / exportable version of the challan table HTML (used by print and PDF)
const buildPrintableChallanTableHtml = () => {
  const printArea = document.getElementById("my-challans-table-print-area");
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
    // ignore and fall back to original clone
  }

  return printTable.outerHTML;
};

// Print challan table in a new window using branding header (same style as My Fleet)
export const handleChallanPrint = () => {
  const tableHtml = buildPrintableChallanTableHtml();
  if (!tableHtml) return;

  const win = window.open("", "", "height=700,width=1200");
  if (!win) return;
  win.document.write("<html><head><title>Vehicle Challans</title>");
  win.document.write('<link rel="stylesheet" href="/src/LatestTable.css" />');
  win.document.write(
    "<style>body { margin: 16px; font-family: Segoe UI, Arial, sans-serif; } .sc-branding { display:flex; align-items:center; gap:12px; margin-bottom:16px; } .sc-branding-logo { height:24px !important; max-width:120px !important; object-fit:contain !important; } .sc-branding-text { display:flex; flex-direction:column; } .sc-branding-title { font-size:18px; font-weight:700; color:#1565c0; margin:0; } .sc-branding-sub { font-size:11px; color:#555; margin:4px 0 0; } body .latest-table th, body .latest-table td { padding: 6px 8px !important; font-size: 80% !important; } table { width:100%; border-collapse:collapse; }</style>"
  );
  win.document.write("</head><body>");
  win.document.write('<div class="sc-branding">');
  win.document.write(
    `<img class=\"sc-branding-logo\" src=\"${BRAND_LOGO}\" alt=\"Smart Challan Logo\" />`
  );
  win.document.write('<div class="sc-branding-text">');
  win.document.write('<p class="sc-branding-sub">Vehicle Challans Summary</p>');
  win.document.write("</div>");
  win.document.write("</div>");
  win.document.write(tableHtml);
  win.document.write("</body></html>");
  win.document.close();
  win.print();
};

// Download branded challan PDF directly using jsPDF (same behavior as My Fleet)
const handleChallanDownloadPdf = () => {
  const tableHtml = buildPrintableChallanTableHtml();
  if (!tableHtml) return;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = `
    <div class="sc-branding">
      <img class="sc-branding-logo" style="height:36px; max-width:180px; object-fit:contain;" src="${BRAND_LOGO}" alt="Smart Challan Logo" />
      <div class="sc-branding-text">
        <p class="sc-branding-sub">Vehicle Challans Summary</p>
      </div>
    </div>
    ${tableHtml}
  `;
  document.body.appendChild(container);

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

        pdf.save("VehicleChallans.pdf");
      })
      .finally(() => {
        document.body.removeChild(container);
      });
  }, 400);
};

// Download challans as Excel (similar mapping style to My Fleet)
export const handleChallanDownloadExcel = (rows) => {
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
    "Reg Court": c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court,
    "Virtual Court": c.sent_to_virtual_court ?? c.sent_to_virtual,
    "Fine Imposed": c.fine_imposed,
    "Fine Paid": c.received_amount,
    Status: c.challan_status,
    "Offence Details": Array.isArray(c.offence_details)
      ? c.offence_details.map((o) => o && o.name ? o.name : '').filter(Boolean).join('; ')
      : '',
  }));
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Challans");
  XLSX.writeFile(wb, "VehicleChallans.xlsx");
};

// ...existing code...
export function ChallanTable({
  title,
  data,
  search = {},
  sortAsc = true,
  sortKey = 'date',
  addToCart,
  removeFromCart,
  cart,
  showCart,
  setShowCart,
  settlementMode,
  sidebarOpen,
  setSidebarOpen,
  setSelectedChallan,
  onToggleSort,
  onVisibleCountChange,
}) {
  // Utility to format Reg Court values
  function formatRegCourtValue(v) {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '-';
      if (s.toLowerCase() === 'yes' || s.toLowerCase() === 'no') return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      // If it's a date-like string, shorten to YYYY-MM-DD or first 10 chars
      if (/\d{4}-\d{2}-\d{2}/.test(s) || /\d{2}-\d{2}-\d{4}/.test(s) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(s)) return s.length > 10 ? s.slice(0, 10) : s;
      return s;
    }
    return String(v);
  }
  // Filter and sort logic for table
  const DEFAULT_LIMIT = 30;
  const [visibleCount, setVisibleCount] = useState(DEFAULT_LIMIT);
  const [infoModal, setInfoModal] = useState({ open: false, message: '' });
  const filtered = Array.isArray(data)
    ? data.filter(c => {
        const vehicleMatch = search.vehicle ? String(c.vehicle_number || '').toUpperCase().includes(search.vehicle.toUpperCase()) : true;
        const challanMatch = search.challan ? String(c.challan_no || '').toUpperCase().includes(search.challan.toUpperCase()) : true;
        return vehicleMatch && challanMatch;
      })
    : [];
  const sorted = [...filtered].sort((a, b) => {
    const parseDate = (s) =>
      s
        ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime()
        : 0;

    if (sortKey === 'fine') {
      const parseFine = (val) => {
        if (val === null || val === undefined || val === '') return Number.NaN;
        const num = parseFloat(String(val).replace(/[,₹\s]/g, ''));
        return Number.isNaN(num) ? Number.NaN : num;
      };
      const fa = parseFine(a.fine_imposed);
      const fb = parseFine(b.fine_imposed);
      const av = Number.isNaN(fa) ? 0 : fa;
      const bv = Number.isNaN(fb) ? 0 : fb;
      return sortAsc ? av - bv : bv - av;
    }

    // Default: sort by date/time
    const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
    const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
    return sortAsc ? aTime - bTime : bTime - aTime;
  });
  const limited = sorted.slice(0, visibleCount);
  // Report visible vs total counts to parent (e.g., ChallanSettlement header)
  useEffect(() => {
    if (typeof onVisibleCountChange === 'function') {
      const visible = Math.min(filtered.length, visibleCount);
      onVisibleCountChange(visible, filtered.length);
    }
  }, [filtered.length, visibleCount, onVisibleCountChange]);
  const [showFull, setShowFull] = useState({});
  // sidebarOpen and setSidebarOpen are now passed from parent
  return (
    <div>
      <div className="modern-table-container">
        {title && (
          <div className="modern-table-header">
            <h2>{title} <span className="modern-table-count">({filtered.length})</span></h2>
            {filtered.length > 0 && !settlementMode && (
              <div className="modern-table-caption">
                Showing {Math.min(filtered.length, visibleCount)} of {filtered.length} challans
              </div>
            )}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="modern-table-empty">No challans found.</div>
        ) : (
          <>
            <table className="latest-table" style={{width: '100%'}}>
              <thead>
                <tr>
                  {settlementMode && <th></th>}
                  <th>#</th>
                  <th>Vehicle No.</th>
                  <th>Challan No</th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={typeof onToggleSort === 'function' ? () => onToggleSort('date') : undefined}
                  >
                    Date/Time
                    <span style={{ fontSize: 13, marginLeft: 2 }}>
                      {sortKey === 'date' ? (sortAsc ? '▲' : '▼') : '▲▼'}
                    </span>
                  </th>
                  <th>Location</th>
                  {title && title.toLowerCase().includes('pending') && <th>Sent to Reg Court</th>}
                  {title && title.toLowerCase().includes('pending') && <th>Sent to Virtual Court</th>}
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={typeof onToggleSort === 'function' ? () => onToggleSort('fine') : undefined}
                  >
                    Fine Imposed
                    <span style={{ fontSize: 13, marginLeft: 2 }}>
                      {sortKey === 'fine' ? (sortAsc ? '▲' : '▼') : '▲▼'}
                    </span>
                  </th>
                  {title && title.toLowerCase().includes('disposed') && <th>Fine Paid</th>}
                  {!settlementMode && <th>Status</th>}
                  <th>Offence Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {limited.map((c, idx) => (
                  <tr key={c.challan_no || idx}>
                    {settlementMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={cart && cart.some(s => s.challan_no === c.challan_no)}
                          onChange={() => (cart && cart.some(s => s.challan_no === c.challan_no) ? removeFromCart(c) : addToCart(c))}
                        />
                      </td>
                    )}
                    <td>{idx + 1}</td>
                    <td>{c.vehicle_number || '-'}</td>
                    <td>{c.challan_no || '-'}</td>
                    <td>{c.challan_date_time || c.created_at || c.createdAt}</td>
                    <td>
                      {(() => {
                        const loc = c.challan_place || c.location || c.challan_location || c.address || c.owner_address;
                        if (loc && typeof loc === 'string' && loc.trim()) {
                          return (
                            <span
                              className="modern-table-map"
                              title={loc}
                              onClick={() => {
                                setInfoModal({
                                  open: true,
                                  message: (
                                    <iframe
                                      title="Google Maps"
                                      width="910"
                                      height="500"
                                      style={{ border: 0, borderRadius: 12 }}
                                      src={`https://www.google.com/maps?q=${encodeURIComponent(loc)}&output=embed`}
                                      allowFullScreen
                                    />
                                  )
                                });
                              }}
                              style={{ cursor: 'pointer', color: '#4285F4', fontSize: 20, verticalAlign: 'middle' }}
                            >
                              <i className="ri-map-pin-2-fill" />
                            </span>
                          );
                        }
                        return 'Not Available';
                      })()}
                    </td>
                    {title && title.toLowerCase().includes('pending') && (
                      <td>{formatRegCourtValue(c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court)}</td>
                    )}
                    {title && title.toLowerCase().includes('pending') && (
                      <td>{formatRegCourtValue(c.sent_to_virtual_court ?? c.sent_to_virtual)}</td>
                    )}
                    <td>{c.fine_imposed}</td>
                    {title && title.toLowerCase().includes('disposed') && (
                      <td>{c.received_amount ?? '-'}</td>
                    )}
                    {!settlementMode && (
                      <td>
                        <span className={`modern-table-status ${c.challan_status === 'Pending' ? 'pending' : c.challan_status === 'Disposed' ? 'paid' : ''}`}>{c.challan_status}</span>
                      </td>
                    )}
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
                        onClick={() => {
                          setSelectedChallan(c);
                          setSidebarOpen(true);
                        }}>
                        <i className="ri-eye-line" style={{fontSize:20}}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Show more records control similar to MyFleetTable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 24 }}>
              <span style={{ color: '#1976d2', fontSize: 15 }}>
                Show more records:
              </span>
              <SelectShowMore
                onShowMoreRecords={val => {
                  if (val === 'all') setVisibleCount(sorted.length);
                  else setVisibleCount(Number(val));
                }}
                onResetRecords={() => setVisibleCount(DEFAULT_LIMIT)}
                maxCount={sorted.length}
              />
            </div>
          </>
        )}
      </div>
      <CustomModal
        open={infoModal.open}
        title={infoModal.message}
        onConfirm={() => setInfoModal({ open: false, message: '' })}
        onCancel={() => setInfoModal({ open: false, message: '' })}
        confirmText="OK"
        cancelText={null}
      />
    </div>
  );
}
export default function MyChallans({ initialFilter = null }) {
  const [challanData, setChallanData] = useState({ Disposed_data: [], Pending_data: [] });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchChallans() {
      try {
        const API_ROOT = import.meta.env.VITE_API_BASE_URL;
        if (!API_ROOT) {
          throw new Error('VITE_API_BASE_URL is not set. Please check your .env file and restart the dev server.');
        }
        // Determine clientId from logged-in user stored in localStorage (sc_user)
        let clientId = null;
        try {
          const stored = JSON.parse(localStorage.getItem('sc_user')) || {};
          if (stored && stored.user) {
            clientId = stored.user.id || stored.user._id || stored.user.client_id || null;
          }
        } catch (e) {
          clientId = null;
        }
        if (!clientId) {
          // If client id not available, avoid making the API call and clear data
          setChallanData({ Disposed_data: [], Pending_data: [] });
          return;
        }
        const url = `${API_ROOT}/getvehicleechallandata?clientId=${clientId}`;
        const res = await fetch(url);
        const data = await res.json();
        // Flatten all challans (pending + disposed) from all vehicles,
        // and add vehicle_number to each challan so they can be shown
        // together in the Vehicle Challans table with status filters.
        const allChallans = [];
        if (Array.isArray(data)) {
          data.forEach(vehicle => {
            if (Array.isArray(vehicle.pending_data)) {
              vehicle.pending_data.forEach(c => {
                allChallans.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
            if (Array.isArray(vehicle.disposed_data)) {
              vehicle.disposed_data.forEach(c => {
                allChallans.push({ ...c, vehicle_number: vehicle.vehicle_number });
              });
            }
          });
        }
        // Sort all challans by newest first (based on created_at / createdAt / challan_date_time)
        const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
        allChallans.sort((a, b) => {
          const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
          const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
          return (bTime || 0) - (aTime || 0);
        });
        setChallanData({
          Disposed_data: [],
          Pending_data: allChallans
        });
      } catch (err) {
        setChallanData({ Disposed_data: [], Pending_data: [] });
      } finally {
        setIsLoading(false);
      }
    }
    fetchChallans();
  }, []);

  const [selectedChallan, setSelectedChallan] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('excel');
  const [downloadRows, setDownloadRows] = useState([]);
  return (
    <div className="my-challans-content">
      {/* <h2 className="page-title">Vehicle Challans</h2> */}
      <p className="page-subtitle">View and manage your pending vehicle challans</p>
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
              <span>Loading vehicle challans - please wait...</span>
            </div>
          </div>
        ) : (
          <ChallanTableV2
            title="Vehicle Challans"
            data={challanData.Pending_data}
            initialFilter={initialFilter}
            onView={c => {
              setSelectedChallan(c);
              setSidebarOpen(true);
            }}
            onClickDownload={(rows) => {
              setDownloadRows(Array.isArray(rows) ? rows : []);
              setDownloadFormat('excel');
              setShowDownloadModal(true);
            }}
            onClickPrint={handleChallanPrint}
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
              {selectedChallan.challan_status === 'Disposed' && (
                <>
                  <tr><td><b>Receipt No</b></td><td>{selectedChallan.receipt_no}</td></tr>
                  <tr><td><b>Received Amount</b></td><td>{selectedChallan.received_amount}</td></tr>
                </>
              )}
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
        title="Download Vehicle Challans"
        description="Choose the format in which you want to download the challans."
        confirmText={downloadFormat === 'excel' ? 'Download Excel' : 'Download PDF'}
        cancelText="Cancel"
        onConfirm={() => {
          const rows = Array.isArray(downloadRows) ? downloadRows : (Array.isArray(challanData.Pending_data) ? challanData.Pending_data : []);
          if (downloadFormat === 'excel') {
            handleChallanDownloadExcel(rows);
          } else {
            // PDF handler prints the DOM; if rows provided we attempt to render filtered view first
            handleChallanDownloadPdf();
          }
          setShowDownloadModal(false);
        }}
        onCancel={() => setShowDownloadModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="download-format-challans"
              value="excel"
              checked={downloadFormat === 'excel'}
              onChange={() => setDownloadFormat('excel')}
            />
            <span>Excel (.xlsx)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="download-format-challans"
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
