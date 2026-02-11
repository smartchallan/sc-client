import React from 'react';
import { FaPrint } from 'react-icons/fa';

export default function PrintButton({ onPrint = () => {}, className = '', style = {}, title = 'Print' }) {
  const handle = () => {
    try {
      if (window && typeof window.handlePrint === 'function') return window.handlePrint();
    } catch (e) {}
    try { onPrint(); } catch (e) {}
  };

  return (
    <button title={title} onClick={handle} className={className} style={style}>
      <FaPrint />
    </button>
  );
}
