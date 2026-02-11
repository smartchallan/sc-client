import React from 'react';
import { FaFileExcel } from 'react-icons/fa';
import exportToXlsx from '../utils/exportToXlsx';

export default function ExportExcelButton({ data, filename = 'export.xlsx', sheetName = 'Sheet1', children, className = '', style = {}, onComplete = () => {} }) {
  const handleClick = () => {
    const ok = exportToXlsx(data, filename, sheetName);
    try { onComplete(ok); } catch (e) {}
  };

  return (
    <button onClick={handleClick} className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #e6eef8', background: '#fff', cursor: 'pointer', ...style }} title="Download Excel">
      <FaFileExcel style={{ color: '#2e7d32' }} />
      {children || 'Download Excel'}
    </button>
  );
}
