import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import exportToPdf from '../utils/exportToPdf';

export default function ExportPdfButton({ section = 'export', data, filename, children, className = '', style = {}, onComplete = () => {} }) {
  const handleClick = () => {
    const ok = exportToPdf(section, data, filename);
    try { onComplete(ok); } catch (e) {}
  };

  return (
    <button onClick={handleClick} className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #e6eef8', background: '#fff', cursor: 'pointer', ...style }} title="Download PDF">
      <FaFilePdf style={{ color: '#c62828' }} />
      {children || 'Download PDF'}
    </button>
  );
}
