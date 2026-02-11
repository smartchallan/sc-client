import React from 'react';

export default function ErrorBanner({ message = 'An error occurred', onClose = () => {} }) {
  return (
    <div style={{background:'#ffebee',border:'1px solid #ffcdd2',color:'#b71c1c',padding:12,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div>{message}</div>
      <button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',color:'#b71c1c'}}>Close</button>
    </div>
  );
}
