import React from 'react';
import { FaFileExcel, FaFilePdf, FaPrint, FaSearch } from 'react-icons/fa';
import { RiRefreshLine } from 'react-icons/ri';

export default function HeaderActions({
  searchValue = '',
  onSearchChange = () => {},
  onOpenExport = () => {},
  onExportExcel = () => {},
  onExportPDF = () => {},
  onPrint = () => {},
  onRefresh = () => {},
  className = ''
}) {
  const callOrFallback = (globalName, fallback, ...args) => {
    try {
      const fn = typeof window !== 'undefined' && window[globalName];
      if (typeof fn === 'function') return fn(...args);
    } catch (_) {}
    return fallback(...args);
  };

  return (
    <div className={`header-actions ${className}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Export" onClick={() => callOrFallback('handleOpenExport', onOpenExport)} style={actionBtnStyle}>
          <FaFileExcel style={{ marginRight: 8 }} /> Export
        </button>
        <button title="Excel" onClick={() => callOrFallback('handleExportExcel', onExportExcel)} style={iconBtnStyle}>
          <FaFileExcel />
        </button>
        <button title="PDF" onClick={() => callOrFallback('handleExportPDF', onExportPDF)} style={iconBtnStyle}>
          <FaFilePdf />
        </button>
        <button title="Print" onClick={() => callOrFallback('handlePrint', onPrint)} style={iconBtnStyle}>
          <FaPrint />
        </button>
        <button title="Refresh" onClick={() => callOrFallback('handleRefresh', onRefresh)} style={iconBtnStyle}>
          <RiRefreshLine />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 6, padding: '6px 8px', border: '1px solid #e6eef8' }}>
        <FaSearch style={{ color: '#666', marginRight: 8 }} />
        <input
          value={searchValue}
          onChange={(e) => {
            if (typeof window !== 'undefined' && typeof window.handleSearchChange === 'function') {
              try { window.handleSearchChange(e.target.value); } catch (e) {}
            }
            onSearchChange(e.target.value);
          }}
          placeholder="Search..."
          style={{ border: 'none', outline: 'none', minWidth: 160 }}
        />
      </div>
    </div>
  );
}

const actionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 700,
};

const iconBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  background: '#fff',
  border: '1px solid #e6eef8',
  borderRadius: 6,
  cursor: 'pointer'
};
